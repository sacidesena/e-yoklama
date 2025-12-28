from fastapi import APIRouter, Depends, HTTPException, status, Query ,Response,BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, time, timedelta

from database import get_db
from models import Yoklama, Ders, Kullanici, Sinif, Program, QRKod
from schemas import YoklamaEkle, YoklamaSubmit, YoklamaResponse, YoklamaStats
from routers.auth import get_current_user
from utils.email_sender import send_yoklama_notification

router = APIRouter(prefix="/yoklama", tags=["Yoklama"])

# Helper fonksiyonlar
def ders_saatinde_mi(program: Program) -> tuple[bool, str]:
    """Dersin şu an aktif olup olmadığını kontrol et"""
    simdi = datetime.now()
    gun_isimleri = {
        0: "Pazartesi", 1: "Salı", 2: "Çarşamba",
        3: "Perşembe", 4: "Cuma", 5: "Cumartesi", 6: "Pazar"
    }
    
    bugun = gun_isimleri[simdi.weekday()]
    
    # Gün kontrolü
    if program.gun != bugun:
        return False, f"Bu ders {program.gun} günü. Bugün {bugun}."
    
    # Saat kontrolü
    suanki_saat = simdi.time()
    
    # Ders başlamadan 10 dakika önce yoklama açılsın
    baslangic_oncesi = (datetime.combine(date.today(), program.baslangic) - timedelta(minutes=10)).time()
    
    # Ders başladıktan 15 dakika sonraya kadar yoklama alınsın
    bitis_sonrasi = (datetime.combine(date.today(), program.baslangic) + timedelta(minutes=15)).time()
    
    if suanki_saat < baslangic_oncesi:
        return False, "Henüz yoklama zamanı değil."
    
    if suanki_saat > bitis_sonrasi:
        return False, "Yoklama süresi doldu."
    
    # Geç mi kaldı kontrolü
    if suanki_saat > program.baslangic:
        return True, "Gecikti"
    
    return True, "Geldi"

def ayni_cihaz_kontrolu(db: Session, user_id: int, device_fingerprint: str) -> bool:
    """Aynı cihazdan başka öğrenci giriş yapmış mı kontrol et"""
    # Son 2 saat içinde bu fingerprint ile başka kullanıcı giriş yapmış mı?
    iki_saat_once = datetime.now() - timedelta(hours=2)
    
    baska_kullanici = db.query(Yoklama).filter(
        Yoklama.device_fingerprint == device_fingerprint,
        Yoklama.ogrenci_id != user_id,
        Yoklama.zaman >= iki_saat_once
    ).first()
    
    return baska_kullanici is not None

# ===================== YOKLAMA İŞLEMLERİ =====================

@router.post("/submit", response_model=YoklamaResponse)
async def submit_yoklama(
    yoklama_data: YoklamaSubmit,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Öğrenci QR kod tarayarak yoklama verir"""
    # Sadece öğrenciler yoklama verebilir
    if current_user.rol != "ogrenci":
        raise HTTPException(status_code=403, detail="Sadece öğrenciler yoklama verebilir")
    
    # QR kod kontrolü
    qr_kod = db.query(QRKod).filter(
        QRKod.sinif_id == yoklama_data.sinif_id,
        QRKod.qr_data == yoklama_data.qr_data
    ).first()
    
    if not qr_kod:
        raise HTTPException(status_code=400, detail="Geçersiz QR kod")
    
    # Bu sınıfta şu an hangi ders var?
    simdi = datetime.now()
    gun_isimleri = {
        0: "Pazartesi", 1: "Salı", 2: "Çarşamba",
        3: "Perşembe", 4: "Cuma", 5: "Cumartesi", 6: "Pazar"
    }
    bugun = gun_isimleri[simdi.weekday()]
    suanki_saat = simdi.time()
    
    # Aktif program bul
    aktif_program = db.query(Program).filter(
        Program.sinif_id == yoklama_data.sinif_id,
        Program.gun == bugun,
        Program.aktif == True
    ).all()
    
    # Hangi dersin saatinde olduğunu bul
    uygun_program = None
    for prog in aktif_program:
        # 10 dakika önce - 15 dakika sonra aralığında mı?
        baslangic_oncesi = (datetime.combine(date.today(), prog.baslangic) - timedelta(minutes=10)).time()
        bitis_sonrasi = (datetime.combine(date.today(), prog.baslangic) + timedelta(minutes=15)).time()
        
        if baslangic_oncesi <= suanki_saat <= bitis_sonrasi:
            uygun_program = prog
            break
    
    if not uygun_program:
        raise HTTPException(status_code=400, detail="Şu anda bu sınıfta yoklama alınabilecek ders yok")
    
    # Ders saatinde mi kontrol et
    ders_aktif, durum_mesaj = ders_saatinde_mi(uygun_program)
    if not ders_aktif:
        raise HTTPException(status_code=400, detail=durum_mesaj)
    
    # Aynı cihazdan başka öğrenci giriş yapmış mı?
    if ayni_cihaz_kontrolu(db, current_user.id, yoklama_data.device_fingerprint):
        raise HTTPException(
            status_code=400,
            detail="Bu cihazdan başka bir öğrenci yakın zamanda yoklama vermiş. Lütfen kendi cihazınızı kullanın."
        )
    
    # Bugün bu derse yoklama vermiş mi?
    bugun_start = datetime.combine(date.today(), time.min)
    bugun_end = datetime.combine(date.today(), time.max)
    
    mevcut_yoklama = db.query(Yoklama).filter(
        Yoklama.ogrenci_id == current_user.id,
        Yoklama.ders_id == uygun_program.ders_id,
        Yoklama.sinif_id == yoklama_data.sinif_id,
        Yoklama.zaman >= bugun_start,
        Yoklama.zaman <= bugun_end
    ).first()
    
    if mevcut_yoklama:
        raise HTTPException(status_code=400, detail="Bu derse bugün zaten yoklama verdiniz")
    
    # Device fingerprint'i kullanıcıya kaydet
    if not current_user.device_fingerprint:
        current_user.device_fingerprint = yoklama_data.device_fingerprint
    elif current_user.device_fingerprint != yoklama_data.device_fingerprint:
        raise HTTPException(
            status_code=400,
            detail="Farklı bir cihazdan giriş yapmaya çalışıyorsunuz. Lütfen kayıtlı cihazınızı kullanın."
        )
    
    # Konum bilgisi
    konum_str = None
    if yoklama_data.konum:
        konum_str = f"{yoklama_data.konum.get('latitude')},{yoklama_data.konum.get('longitude')}"
    
    # Yoklama kaydı oluştur
    yeni_yoklama = Yoklama(
        ogrenci_id=current_user.id,
        ders_id=uygun_program.ders_id,
        sinif_id=yoklama_data.sinif_id,
        zaman=datetime.now(),
        durum=durum_mesaj,  # "Geldi" veya "Gecikti"
        device_fingerprint=yoklama_data.device_fingerprint,
        konum=konum_str
    )
    
    db.add(yeni_yoklama)
    db.commit()
    db.refresh(yeni_yoklama)
    
    ders = db.query(Ders).filter(Ders.id == uygun_program.ders_id).first()
    sinif = db.query(Sinif).filter(Sinif.id == yoklama_data.sinif_id).first()

    # ✅ ÖĞRETMENE MAİL GÖNDER (Arka planda)
    if uygun_program.ogretmen_mail:
        background_tasks.add_task(
            send_yoklama_notification,
            ogretmen_mail=uygun_program.ogretmen_mail,
            ogrenci_adi=current_user.ad,
            ders_adi=ders.ad if ders else "Bilinmeyen Ders",
            sinif_adi=sinif.ad if sinif else "Bilinmeyen Sınıf",
            durum=durum_mesaj,
            zaman=yeni_yoklama.zaman.strftime("%d.%m.%Y %H:%M")
        )
        print(f"📧 Mail gönderiliyor: {uygun_program.ogretmen_mail}")
    
    return {
        "id": yeni_yoklama.id,
        "ogrenci_id": yeni_yoklama.ogrenci_id,
        "ders_id": yeni_yoklama.ders_id,
        "sinif_id": yeni_yoklama.sinif_id,
        "zaman": yeni_yoklama.zaman,
        "durum": yeni_yoklama.durum,
        "ogrenci_adi": current_user.ad,
        "ders_adi": ders.ad if ders else None
    }

@router.post("/manuel", response_model=YoklamaResponse, status_code=status.HTTP_201_CREATED)
async def create_yoklama_manuel(
    yoklama_data: YoklamaEkle,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Manuel yoklama ekle (Öğretmen/Admin)"""
    if current_user.rol not in ["admin", "ogretmen"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    # Öğrenci var mı?
    ogrenci = db.query(Kullanici).filter(
        Kullanici.id == yoklama_data.ogrenci_id,
        Kullanici.rol == "ogrenci"
    ).first()
    if not ogrenci:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    
    # Ders var mı?
    ders = db.query(Ders).filter(Ders.id == yoklama_data.ders_id).first()
    if not ders:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    
    # Sınıf var mı?
    sinif = db.query(Sinif).filter(Sinif.id == yoklama_data.sinif_id).first()
    if not sinif:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")
    
    # Yoklama oluştur
    konum_str = None
    if yoklama_data.konum:
        konum_str = f"{yoklama_data.konum.get('latitude')},{yoklama_data.konum.get('longitude')}"
    
    yeni_yoklama = Yoklama(
        ogrenci_id=yoklama_data.ogrenci_id,
        ders_id=yoklama_data.ders_id,
        sinif_id=yoklama_data.sinif_id,
        zaman=datetime.now(),
        durum="Geldi",
        device_fingerprint=yoklama_data.device_fingerprint,
        konum=konum_str
    )
    
    db.add(yeni_yoklama)
    db.commit()
    db.refresh(yeni_yoklama)
    
    return {
        "id": yeni_yoklama.id,
        "ogrenci_id": yeni_yoklama.ogrenci_id,
        "ders_id": yeni_yoklama.ders_id,
        "sinif_id": yeni_yoklama.sinif_id,
        "zaman": yeni_yoklama.zaman,
        "durum": yeni_yoklama.durum,
        "ogrenci_adi": ogrenci.ad,
        "ders_adi": ders.ad
    }

@router.get("/me", response_model=List[YoklamaResponse])
async def get_my_yoklama(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    baslangic_tarihi: Optional[date] = None,
    bitis_tarihi: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Öğrencinin kendi yoklama kayıtlarını getir"""
    if current_user.rol != "ogrenci":
        raise HTTPException(status_code=403, detail="Sadece öğrenciler bu işlemi yapabilir")
    
    query = db.query(Yoklama).filter(Yoklama.ogrenci_id == current_user.id)
    
    if baslangic_tarihi:
        query = query.filter(Yoklama.zaman >= datetime.combine(baslangic_tarihi, time.min))
    if bitis_tarihi:
        query = query.filter(Yoklama.zaman <= datetime.combine(bitis_tarihi, time.max))
    
    yoklamalar = query.order_by(Yoklama.zaman.desc()).offset(skip).limit(limit).all()
    
    result = []
    for yoklama in yoklamalar:
        ders = db.query(Ders).filter(Ders.id == yoklama.ders_id).first()
        result.append({
            "id": yoklama.id,
            "ogrenci_id": yoklama.ogrenci_id,
            "ders_id": yoklama.ders_id,
            "sinif_id": yoklama.sinif_id,
            "zaman": yoklama.zaman,
            "durum": yoklama.durum,
            "ogrenci_adi": current_user.ad,
            "ders_adi": ders.ad if ders else None
        })
    
    return result

@router.get("/me/stats", response_model=YoklamaStats)
async def get_my_stats(
    baslangic_tarihi: Optional[date] = None,
    bitis_tarihi: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Öğrencinin yoklama istatistiklerini getir"""
    
    try:
        if current_user.rol != "ogrenci":
            raise HTTPException(status_code=403, detail="Sadece öğrenciler bu işlemi yapabilir")
        
        query = db.query(Yoklama).filter(Yoklama.ogrenci_id == current_user.id)
        
        if baslangic_tarihi:
            query = query.filter(Yoklama.zaman >= datetime.combine(baslangic_tarihi, time.min))
        if bitis_tarihi:
            query = query.filter(Yoklama.zaman <= datetime.combine(bitis_tarihi, time.max))
        
        yoklamalar = query.all()
        
        toplam = len(yoklamalar)
        geldi = len([y for y in yoklamalar if y.durum == "Geldi"])
        gecikti = len([y for y in yoklamalar if y.durum == "Gecikti"])
        
        # Toplam ders sayısını hesapla
        toplam_ders = db.query(Program).filter(Program.aktif == True).count()
        
        # Eğer toplam ders 0 ise, güvenli değerler dön
        if toplam_ders == 0:
            toplam_ders = 1  # Bölme hatasını önle
        
        katilim_orani = (geldi / toplam_ders * 100) if toplam_ders > 0 else 0
        
        return {
            "toplam_ders": toplam_ders,
            "katilim_sayisi": geldi,
            "devamsizlik_sayisi": max(0, toplam_ders - toplam),
            "gecikme_sayisi": gecikti,
            "katilim_orani": round(katilim_orani, 2)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Stats hatası: {e}")  # Backend'de göreceksin
        # Hata durumunda varsayılan değerler dön
        return {
            "toplam_ders": 0,
            "katilim_sayisi": 0,
            "devamsizlik_sayisi": 0,
            "gecikme_sayisi": 0,
            "katilim_orani": 0.0
        }


@router.get("/ders/{ders_id}", response_model=List[YoklamaResponse])
async def get_ders_yoklama(
    ders_id: int,
    tarih: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Belirli bir dersin yoklama listesini getir"""
    if current_user.rol not in ["admin", "ogretmen"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    ders = db.query(Ders).filter(Ders.id == ders_id).first()
    if not ders:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    
    query = db.query(Yoklama).filter(Yoklama.ders_id == ders_id)
    
    if tarih:
        query = query.filter(
            Yoklama.zaman >= datetime.combine(tarih, time.min),
            Yoklama.zaman <= datetime.combine(tarih, time.max)
        )
    else:
        bugun = date.today()
        query = query.filter(
            Yoklama.zaman >= datetime.combine(bugun, time.min),
            Yoklama.zaman <= datetime.combine(bugun, time.max)
        )
    
    yoklamalar = query.all()
    
    result = []
    for yoklama in yoklamalar:
        ogrenci = db.query(Kullanici).filter(Kullanici.id == yoklama.ogrenci_id).first()
        result.append({
            "id": yoklama.id,
            "ogrenci_id": yoklama.ogrenci_id,
            "ders_id": yoklama.ders_id,
            "sinif_id": yoklama.sinif_id,
            "zaman": yoklama.zaman,
            "durum": yoklama.durum,
            "ogrenci_adi": ogrenci.ad if ogrenci else None,
            "ders_adi": ders.ad
        })
    
    return result

@router.delete("/{yoklama_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_yoklama(
    yoklama_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Yoklama kaydını sil (Admin)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    yoklama = db.query(Yoklama).filter(Yoklama.id == yoklama_id).first()
    
    if not yoklama:
        raise HTTPException(status_code=404, detail="Yoklama kaydı bulunamadı")
    
    db.delete(yoklama)
    db.commit()
    
    return None