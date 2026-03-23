from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Sinif, Kullanici, Program, QRKod
from schemas import SinifEkle, SinifGuncelle, SinifResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/siniflar", tags=["Sınıflar"])

# Admin/Öğretmen kontrolü
async def get_admin_or_teacher(current_user: Kullanici = Depends(get_current_user)):
    if current_user.rol not in ["admin", "ogretmen"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    return current_user

# Endpoints
@router.get("/", response_model=List[SinifResponse])
async def list_siniflar(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Tüm sınıfları listele"""
    query = db.query(Sinif)
    
    # Arama
    if search:
        search_filter = f"%{search}%"
        query = query.filter(Sinif.ad.like(search_filter))
    
    siniflar = query.offset(skip).limit(limit).all()
    return siniflar

@router.get("/{sinif_id}", response_model=SinifResponse)
async def get_sinif(
    sinif_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Belirli bir sınıfın bilgilerini getir"""
    sinif = db.query(Sinif).filter(Sinif.id == sinif_id).first()
    
    if not sinif:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")
    
    return sinif

@router.post("/", response_model=SinifResponse, status_code=status.HTTP_201_CREATED)
async def create_sinif(
    sinif_data: SinifEkle,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_or_teacher)
):
    """Yeni sınıf oluştur"""
    # Aynı isimde sınıf var mı kontrol et
    existing = db.query(Sinif).filter(Sinif.ad == sinif_data.ad).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"'{sinif_data.ad}' isimli sınıf zaten mevcut"
        )
    
    # Yeni sınıf oluştur
    new_sinif = Sinif(ad=sinif_data.ad)
    
    db.add(new_sinif)
    db.commit()
    db.refresh(new_sinif)
    
    return new_sinif

@router.put("/{sinif_id}", response_model=SinifResponse)
async def update_sinif(
    sinif_id: int,
    sinif_data: SinifGuncelle,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_or_teacher)
):
    """Sınıf bilgilerini güncelle"""
    sinif = db.query(Sinif).filter(Sinif.id == sinif_id).first()
    
    if not sinif:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")
    
    # İsim güncelleniyorsa kontrol et
    if sinif_data.ad and sinif_data.ad != sinif.ad:
        existing = db.query(Sinif).filter(
            Sinif.ad == sinif_data.ad,
            Sinif.id != sinif_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"'{sinif_data.ad}' isimli sınıf zaten mevcut"
            )
        sinif.ad = sinif_data.ad
    
    db.commit()
    db.refresh(sinif)
    
    return sinif

@router.delete("/{sinif_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sinif(
    sinif_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_or_teacher)
):
    """Sınıfı sil"""
    sinif = db.query(Sinif).filter(Sinif.id == sinif_id).first()
    
    if not sinif:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")
    
    # Sınıfa bağlı program var mı kontrol et
    program_count = db.query(Program).filter(Program.sinif_id == sinif_id).count()
    if program_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Bu sınıfa bağlı ders programları var. Önce programları silin."
        )
    
    # QR kod var mı kontrol et
    qr_kod = db.query(QRKod).filter(QRKod.sinif_id == sinif_id).first()
    if qr_kod:
        db.delete(qr_kod)
    
    db.delete(sinif)
    db.commit()
    
    return None

@router.get("/{sinif_id}/program")
async def get_sinif_program(
    sinif_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Sınıfın haftalık ders programını getir"""
    sinif = db.query(Sinif).filter(Sinif.id == sinif_id).first()
    if not sinif:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")
    
    # Programları getir
    from models import Ders
    programlar = db.query(Program).filter(
        Program.sinif_id == sinif_id,
        Program.aktif == True
    ).order_by(Program.gun, Program.baslangic).all()
    
    # Günlere göre grupla
    program_dict = {}
    for prog in programlar:
        if prog.gun not in program_dict:
            program_dict[prog.gun] = []
        
        ders = db.query(Ders).filter(Ders.id == prog.ders_id).first()
        ogretmen = db.query(Kullanici).filter(Kullanici.id == prog.ogretmen_mail).first()
        
        program_dict[prog.gun].append({
            "id": prog.id,
            "ders_adi": ders.ad if ders else None,
            "ogretmen_adi": ogretmen.ad if ogretmen else None,
            "baslangic": prog.baslangic.strftime("%H:%M"),
            "bitis": prog.bitis.strftime("%H:%M")
        })
    
    return {
        "sinif_id": sinif_id,
        "sinif_adi": sinif.ad,
        "program": program_dict
    }

@router.get("/{sinif_id}/qr")
async def get_sinif_qr(
    sinif_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Sınıfın QR kodunu getir"""
    sinif = db.query(Sinif).filter(Sinif.id == sinif_id).first()
    if not sinif:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")
    
    qr_kod = db.query(QRKod).filter(QRKod.sinif_id == sinif_id).first()
    if not qr_kod:
        raise HTTPException(status_code=404, detail="Bu sınıf için QR kod oluşturulmamış")
    
    return {
        "sinif_id": sinif_id,
        "sinif_adi": sinif.ad,
        "qr_data": qr_kod.qr_data,
        "dosya_yolu": qr_kod.dosya_yolu,
        "olusturma_tarihi": qr_kod.olusturma_tarihi
    }

@router.post("/{sinif_id}/qr/generate")
async def generate_sinif_qr(
    sinif_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_or_teacher)
):
    """Sınıf için yeni QR kod oluştur"""
    sinif = db.query(Sinif).filter(Sinif.id == sinif_id).first()
    if not sinif:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")
    
    import qrcode
    import io
    import base64
    from datetime import datetime
    import os
    
    # QR data oluştur
    qr_data = f"SINIF:{sinif_id}:{sinif.ad}"
    
    # QR kod oluştur
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Base64'e çevir
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Dosya yolu (opsiyonel, base64 de kullanabilirsin)
    dosya_yolu = f"data:image/png;base64,{img_base64}"
    
    # Mevcut QR kodu kontrol et
    existing_qr = db.query(QRKod).filter(QRKod.sinif_id == sinif_id).first()
    
    if existing_qr:
        # Güncelle
        existing_qr.qr_data = qr_data
        existing_qr.dosya_yolu = dosya_yolu
        existing_qr.guncelleme_tarihi = datetime.utcnow()
        db.commit()
        db.refresh(existing_qr)
        return existing_qr
    else:
        # Yeni oluştur
        new_qr = QRKod(
            sinif_id=sinif_id,
            qr_data=qr_data,
            dosya_yolu=dosya_yolu
        )
        db.add(new_qr)
        db.commit()
        db.refresh(new_qr)
        return new_qr