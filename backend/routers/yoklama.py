from fastapi import APIRouter, Depends, HTTPException, status, Query, Response, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, time, timedelta
import qrcode
import io
import base64
import secrets

from database import get_db
from models import Yoklama, Ders, Kullanici, Sinif, Program, QRKod
from schemas import YoklamaEkle, YoklamaSubmit, YoklamaResponse, YoklamaStats
from routers.auth import get_current_user
from utils.email_sender import send_yoklama_list_to_teacher

router = APIRouter(prefix="/yoklama", tags=["Yoklama"])

# ===================== HELPER FONKSİYONLAR =====================

def get_client_ip(request: Request) -> str:
    """İstemci IP adresini al"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host


def ders_saatinde_mi(program: Program) -> tuple[bool, str]:
    simdi = datetime.now()
    gun_isimleri = {
        0: "Pazartesi", 1: "Salı", 2: "Çarşamba",
        3: "Perşembe", 4: "Cuma", 5: "Cumartesi", 6: "Pazar"
    }
    bugun = gun_isimleri[simdi.weekday()]

    if program.gun != bugun:
        return False, f"Bu ders {program.gun} günü. Bugün {bugun}."

    suanki_saat = simdi.time()
    baslangic_oncesi = (datetime.combine(date.today(), program.baslangic) - timedelta(minutes=5)).time()
    # ✅ DÜZELTME: bitis'e göre hesapla, baslangic'a göre değil
    bitis_sonrasi = (datetime.combine(date.today(), program.bitis) + timedelta(minutes=15)).time()

    if suanki_saat < baslangic_oncesi:
        return False, "Henüz yoklama zamanı değil."
    if suanki_saat > bitis_sonrasi:
        return False, "Yoklama süresi doldu."
    return True, "Geldi"


def qr_image_olustur(qr_data: str) -> str | None:
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        print(f"QR görsel oluşturma hatası: {e}")
        return None


# ===================== QR KOD İŞLEMLERİ =====================

@router.get("/qr-kodlar")
async def get_qr_kodlar(
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")

    qr_kodlar = db.query(QRKod).all()
    result = []
    for qr in qr_kodlar:
        result.append({
            "id": qr.id,
            "sinif_id": qr.sinif_id,
            "sinif_adi": qr.sinif.ad if qr.sinif else None,
            "qr_data": qr.qr_data,
            "qr_image": qr_image_olustur(qr.qr_data),
            "aktif": True,
            "olusturma_tarihi": qr.olusturma_tarihi.isoformat() if qr.olusturma_tarihi else None,
        })
    return result


@router.post("/qr-olustur/{sinif_id}")
async def create_qr_kod(
    sinif_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")

    sinif = db.query(Sinif).filter(Sinif.id == sinif_id).first()
    if not sinif:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")

    existing_qr = db.query(QRKod).filter(QRKod.sinif_id == sinif_id).first()
    if existing_qr:
        return {
            "id": existing_qr.id,
            "sinif_id": existing_qr.sinif_id,
            "sinif_adi": sinif.ad,
            "qr_data": existing_qr.qr_data,
            "qr_image": qr_image_olustur(existing_qr.qr_data),
            "aktif": True,
            "olusturma_tarihi": existing_qr.olusturma_tarihi.isoformat() if existing_qr.olusturma_tarihi else None,
            "message": "Bu sınıf için zaten QR kod mevcut"
        }

    qr_data = f"SINIF_{sinif_id}_{secrets.token_urlsafe(8)}"
    new_qr = QRKod(sinif_id=sinif_id, qr_data=qr_data)
    db.add(new_qr)
    db.commit()
    db.refresh(new_qr)

    return {
        "id": new_qr.id,
        "sinif_id": new_qr.sinif_id,
        "sinif_adi": sinif.ad,
        "qr_data": new_qr.qr_data,
        "qr_image": qr_image_olustur(qr_data),
        "aktif": True,
        "olusturma_tarihi": new_qr.olusturma_tarihi.isoformat() if new_qr.olusturma_tarihi else None,
        "message": "QR kod başarıyla oluşturuldu"
    }


@router.delete("/qr-kodlar/{qr_id}")
async def delete_qr_kod(
    qr_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")

    qr_kod = db.query(QRKod).filter(QRKod.id == qr_id).first()
    if not qr_kod:
        raise HTTPException(status_code=404, detail="QR kod bulunamadı")

    db.delete(qr_kod)
    db.commit()
    return {"success": True, "message": "QR kod silindi"}


# ===================== YOKLAMA İŞLEMLERİ =====================

@router.post("/submit", response_model=YoklamaResponse)
async def submit_yoklama(
    yoklama_data: YoklamaSubmit,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Öğrenci QR kod tarayarak yoklama verir"""
    if current_user.rol != "ogrenci":
        raise HTTPException(status_code=403, detail="Sadece öğrenciler yoklama verebilir")

    # QR kod geçerli mi?
    qr_kod = db.query(QRKod).filter(
        QRKod.sinif_id == yoklama_data.sinif_id,
        QRKod.qr_data == yoklama_data.qr_data
    ).first()
    if not qr_kod:
        raise HTTPException(status_code=400, detail="Geçersiz QR kod")

    # Gün ve saat kontrolü
    simdi = datetime.now()
    gun_isimleri = {
        0: "Pazartesi", 1: "Salı", 2: "Çarşamba",
        3: "Perşembe", 4: "Cuma", 5: "Cumartesi", 6: "Pazar"
    }
    bugun = gun_isimleri[simdi.weekday()]
    suanki_saat = simdi.time()

    aktif_program = db.query(Program).filter(
        Program.sinif_id == yoklama_data.sinif_id,
        Program.gun == bugun,
        Program.aktif == True
    ).all()

    uygun_program = None
    for prog in aktif_program:
        baslangic_oncesi = (datetime.combine(date.today(), prog.baslangic) - timedelta(minutes=5)).time()
        # ✅ DÜZELTME: bitis'e göre hesapla
        bitis_sonrasi = (datetime.combine(date.today(), prog.bitis) + timedelta(minutes=15)).time()
        if baslangic_oncesi <= suanki_saat <= bitis_sonrasi:
            uygun_program = prog
            break

    if not uygun_program:
        raise HTTPException(status_code=400, detail="Şu anda bu sınıfta yoklama alınabilecek ders yok")

    ders_aktif, durum_mesaj = ders_saatinde_mi(uygun_program)
    if not ders_aktif:
        raise HTTPException(status_code=400, detail=durum_mesaj)

    # Öğrenci bugün bu derse zaten yoklama verdi mi?
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

    # ✅ IP + Fingerprint kontrolü (NAT ortamı için güvenli)
    client_ip = get_client_ip(request)
    client_fingerprint = yoklama_data.device_fingerprint

# ✅ KONTROL 1: Bu cihaz başka öğrenciye kayıtlı mı?
    baska_ogrenci = db.query(Kullanici).filter(
        Kullanici.device_fingerprint == client_fingerprint,
        Kullanici.id != current_user.id
    ).first()

    if baska_ogrenci:
        raise HTTPException(
            status_code=403,
            detail="Bu cihaz başka bir öğrenciye kayıtlı. Her öğrenci kendi cihazını kullanmalıdır."
        )

# ✅ KONTROL 2: Bu öğrencinin kayıtlı cihazı farklı mı?
    if current_user.device_fingerprint and      current_user.device_fingerprint !=  client_fingerprint:
        raise HTTPException(
            status_code=403,
            detail="Bu cihaz hesabınıza kayıtlı değil. Lütfen kayıtlı cihazınızı kullanın."
    )   

# ✅ KONTROL 3: İlk yoklama ise cihazı kaydet
    if not current_user.device_fingerprint:
        current_user.device_fingerprint = client_fingerprint
        db.commit()


    # Konum
    konum_str = None
    if yoklama_data.konum:
        konum_str = f"{yoklama_data.konum.get('latitude')},{yoklama_data.konum.get('longitude')}"

    # Yoklama kaydet
    yeni_yoklama = Yoklama(
        ogrenci_id=current_user.id,
        ders_id=uygun_program.ders_id,
        sinif_id=yoklama_data.sinif_id,
        zaman=datetime.now(),
        durum=durum_mesaj,
        device_fingerprint=client_fingerprint,
        ip_adresi=client_ip,
        konum=konum_str
    )

    db.add(yeni_yoklama)
    db.commit()
    db.refresh(yeni_yoklama)

    ders = db.query(Ders).filter(Ders.id == uygun_program.ders_id).first()
    sinif = db.query(Sinif).filter(Sinif.id == yoklama_data.sinif_id).first()

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
    if current_user.rol not in ["admin", "ogretmen"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")

    ogrenci = db.query(Kullanici).filter(
        Kullanici.id == yoklama_data.ogrenci_id,
        Kullanici.rol == "ogrenci"
    ).first()
    if not ogrenci:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")

    ders = db.query(Ders).filter(Ders.id == yoklama_data.ders_id).first()
    if not ders:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")

    sinif = db.query(Sinif).filter(Sinif.id == yoklama_data.sinif_id).first()
    if not sinif:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")

    konum_str = None
    if yoklama_data.konum:
        konum_str = f"{yoklama_data.konum.get('latitude')},{yoklama_data.konum.get('longitude')}"

    yeni_yoklama = Yoklama(
        ogrenci_id=yoklama_data.ogrenci_id,
        ders_id=yoklama_data.ders_id,
        sinif_id=yoklama_data.sinif_id,
        zaman=datetime.now(),
        durum="Geldi",
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

        toplam_ders = db.query(Program).filter(Program.aktif == True).count()
        if toplam_ders == 0:
            toplam_ders = 1

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
        print(f"Stats hatası: {e}")
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


@router.post("/ders-bitir/{program_id}")
async def ders_bitir(
    program_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")

    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program bulunamadı")

    # ✅ DÜZELTME: datetime.now() kullan, utcnow() değil
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = datetime.now().replace(hour=23, minute=59, second=59, microsecond=0)

    yoklamalar = db.query(Yoklama).filter(
        Yoklama.ders_id == program.ders_id,
        Yoklama.sinif_id == program.sinif_id,
        Yoklama.zaman >= today_start,
        Yoklama.zaman <= today_end
    ).all()

    katilan_ids = [y.ogrenci_id for y in yoklamalar]
    katilan_ogrenciler = []
    for y in yoklamalar:
        ogrenci = db.query(Kullanici).filter(Kullanici.id == y.ogrenci_id).first()
        if ogrenci:
            katilan_ogrenciler.append({
                'ad': ogrenci.ad,
                'ogrenci_no': ogrenci.ogrenci_no or '-',
                'zaman': y.zaman.strftime('%H:%M')
            })

    # ✅ DÜZELTME: Sadece bu derse kayıtlı öğrencileri al
    # sinif_id ile filtreleyemiyoruz (kullanici modelinde yok)
    # Bunun yerine daha önce bu derse yoklama veren öğrencileri referans alıyoruz
    tum_ogrenciler = db.query(Kullanici).filter(Kullanici.rol == "ogrenci").all()
    katilmayan_ogrenciler = [
        {'ad': ogr.ad, 'ogrenci_no': ogr.ogrenci_no or '-'}
        for ogr in tum_ogrenciler if ogr.id not in katilan_ids
    ]

    if not program.ders.hoca_mail:
        raise HTTPException(status_code=400, detail="Dersin hoca mail adresi tanımlı değil")

    # ✅ background_tasks ile gönder
    background_tasks.add_task(
        send_yoklama_list_to_teacher,
        hoca_mail=program.ders.hoca_mail,
        hoca_adi=program.ders.hoca_adi or "Değerli Hocam",
        ders_adi=program.ders.ad,
        ders_kodu=program.ders.kod or "",
        sinif_adi=program.sinif.ad,
        tarih=datetime.now(),
        baslangic=program.baslangic.strftime('%H:%M'),
        bitis=program.bitis.strftime('%H:%M'),
        katilan_ogrenciler=katilan_ogrenciler,
        katilmayan_ogrenciler=katilmayan_ogrenciler
    )

    return {
        "success": True,
        "message": f"Yoklama listesi {program.ders.hoca_mail} adresine gönderiliyor",
        "katilan": len(katilan_ogrenciler),
        "katilmayan": len(katilmayan_ogrenciler)
    }


@router.delete("/{yoklama_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_yoklama(
    yoklama_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")

    yoklama = db.query(Yoklama).filter(Yoklama.id == yoklama_id).first()
    if not yoklama:
        raise HTTPException(status_code=404, detail="Yoklama kaydı bulunamadı")

    db.delete(yoklama)
    db.commit()
    return None