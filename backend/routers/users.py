from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Kullanici
from schemas import (
    KullaniciEkle, KullaniciGuncelle, KullaniciResponse, SifreGuncelle
)
from routers.auth import get_current_user, get_password_hash, verify_password

router = APIRouter(prefix="/users", tags=["Kullanıcılar"])

# Admin kontrolü
async def get_admin_user(current_user: Kullanici = Depends(get_current_user)):
    if current_user.rol not in ["admin", "ogretmen"]:
        raise HTTPException(
            status_code=403,
            detail="Bu işlem için yetkiniz yok"
        )
    return current_user

# Endpoints
@router.get("/", response_model=List[KullaniciResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    rol: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_user)
):
    """Tüm kullanıcıları listele"""
    query = db.query(Kullanici)
    
    # Rol filtresi
    if rol:
        query = query.filter(Kullanici.rol == rol)
    
    # Arama
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Kullanici.ad.like(search_filter)) |
            (Kullanici.mail.like(search_filter)) |
            (Kullanici.ogrenci_no.like(search_filter))
        )
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=KullaniciResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Belirli bir kullanıcının bilgilerini getir"""
    # Kullanıcı sadece kendi bilgilerini veya admin/öğretmen herkesin bilgilerini görebilir
    if current_user.id != user_id and current_user.rol not in ["admin", "ogretmen"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    user = db.query(Kullanici).filter(Kullanici.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    return user

@router.post("/", response_model=KullaniciResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: KullaniciEkle,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_user)
):
    """Yeni kullanıcı oluştur (Admin)"""
    # Email kontrolü
    existing_email = db.query(Kullanici).filter(Kullanici.mail == user_data.mail).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Bu email zaten kullanılıyor")
    
    # Öğrenci no kontrolü
    if user_data.ogrenci_no:
        existing_ogrenci = db.query(Kullanici).filter(
            Kullanici.ogrenci_no == user_data.ogrenci_no
        ).first()
        if existing_ogrenci:
            raise HTTPException(status_code=400, detail="Bu öğrenci numarası zaten kayıtlı")
    
    # Yeni kullanıcı oluştur
    hashed_password = get_password_hash(user_data.sifre)
    new_user = Kullanici(
        mail=user_data.mail,
        sifre_hash=hashed_password,
        ad=user_data.ad,
        rol=user_data.rol,
        ogrenci_no=user_data.ogrenci_no if user_data.rol == "ogrenci" else None,
        aktif=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.put("/{user_id}", response_model=KullaniciResponse)
async def update_user(
    user_id: int,
    user_data: KullaniciGuncelle,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Kullanıcı bilgilerini güncelle"""
    user = db.query(Kullanici).filter(Kullanici.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    # Yetki kontrolü
    if current_user.id != user_id and current_user.rol not in ["admin"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    # Email güncelleniyorsa kontrol et
    if user_data.mail and user_data.mail != user.mail:
        existing_email = db.query(Kullanici).filter(
            Kullanici.mail == user_data.mail,
            Kullanici.id != user_id
        ).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Bu email zaten kullanılıyor")
        user.mail = user_data.mail
    
    # Diğer alanları güncelle
    if user_data.ad is not None:
        user.ad = user_data.ad
    if user_data.aktif is not None:
        # Sadece admin aktiflik durumunu değiştirebilir
        if current_user.rol == "admin":
            user.aktif = user_data.aktif
    if user_data.device_fingerprint is not None:
        user.device_fingerprint = user_data.device_fingerprint
    
    db.commit()
    db.refresh(user)
    
    return user

@router.put("/{user_id}/password")
async def change_password(
    user_id: int,
    password_data: SifreGuncelle,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Kullanıcı şifresini değiştir"""
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    user = db.query(Kullanici).filter(Kullanici.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    # Eski şifre kontrolü
    if not verify_password(password_data.eski_sifre, user.sifre_hash):
        raise HTTPException(status_code=400, detail="Eski şifre hatalı")
    
    # Yeni şifre hashle ve kaydet
    user.sifre_hash = get_password_hash(password_data.yeni_sifre)
    db.commit()
    
    return {"message": "Şifre başarıyla değiştirildi"}

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_user)
):
    """Kullanıcıyı sil (Admin)"""
    user = db.query(Kullanici).filter(Kullanici.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    # Kendi hesabını silemesin
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Kendi hesabınızı silemezsiniz")
    
    db.delete(user)
    db.commit()
    
    return None

@router.get("/ogrenci-no/{ogrenci_no}", response_model=KullaniciResponse)
async def get_user_by_ogrenci_no(
    ogrenci_no: str,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_user)
):
    """Öğrenci numarasına göre kullanıcı getir"""
    user = db.query(Kullanici).filter(Kullanici.ogrenci_no == ogrenci_no).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    return user

@router.post("/{user_id}/device-fingerprint")
async def update_device_fingerprint(
    user_id: int,
    fingerprint: str,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Cihaz parmak izini güncelle"""
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    user = db.query(Kullanici).filter(Kullanici.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    user.device_fingerprint = fingerprint
    db.commit()
    
    return {"message": "Cihaz parmak izi güncellendi"}

@router.get("/rol/{rol}", response_model=List[KullaniciResponse])
async def get_users_by_role(
    rol: str,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_user)
):
    """Role göre kullanıcıları listele"""
    users = db.query(Kullanici).filter(Kullanici.rol == rol).all()
    return users