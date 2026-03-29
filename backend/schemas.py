from pydantic import BaseModel, EmailStr
from datetime import datetime, time
from typing import Optional

# ===================== AUTH SCHEMAS =====================

class LoginSchema(BaseModel):
    mail: EmailStr
    sifre: str

class RegisterSchema(BaseModel):
    mail: EmailStr
    ad: str
    sifre: str
    ogrenci_no: Optional[str] = None
    rol: str = "ogrenci"

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    mail: Optional[str] = None

# ===================== KULLANICI SCHEMAS =====================

class KullaniciEkle(BaseModel):
    mail: EmailStr
    ad: str
    rol: str
    sifre: str
    ogrenci_no: Optional[str] = None

class KullaniciGuncelle(BaseModel):
    mail: Optional[EmailStr] = None
    ad: Optional[str] = None
    aktif: Optional[bool] = None
    device_fingerprint: Optional[str] = None

class KullaniciResponse(BaseModel):
    id: int
    mail: str
    ad: str
    rol: str
    aktif: bool
    ogrenci_no: Optional[str] = None
    son_giris: Optional[datetime] = None
    kayit_tarihi: datetime

    class Config:
        from_attributes = True

class SifreGuncelle(BaseModel):
    eski_sifre: str
    yeni_sifre: str

# ===================== SINIF SCHEMAS =====================

class SinifEkle(BaseModel):
    ad: str
    aciklama: Optional[str] = None
    kapasite: Optional[int] = None
    aktif: Optional[bool] = True

class SinifGuncelle(BaseModel):
    ad: Optional[str] = None
    aciklama: Optional[str] = None
    kapasite: Optional[int] = None
    aktif: Optional[bool] = None

class SinifResponse(BaseModel):
    id: int
    ad: str
    aciklama: Optional[str] = None
    kapasite: Optional[int] = None
    aktif: Optional[bool] = None

    class Config:
        from_attributes = True
# ===================== DERS SCHEMAS =====================

class DersEkle(BaseModel):
    ad: str
    kod: str
    hoca_adi: Optional[str] = None
    hoca_mail: Optional[str] = None
    aciklama: Optional[str] = None
    aktif: Optional[bool] = True

class DersGuncelle(BaseModel):
    ad: Optional[str] = None
    kod: Optional[str] = None
    hoca_adi: Optional[str] = None
    hoca_mail: Optional[str] = None
    aciklama: Optional[str] = None
    aktif: Optional[bool] = None

class DersResponse(BaseModel):
    id: int
    ad: str
    kod: Optional[str] = None
    hoca_adi: Optional[str] = None
    hoca_mail: Optional[str] = None
    aciklama: Optional[str] = None
    aktif: Optional[bool] = None
    olusturma_tarihi: Optional[datetime] = None

    class Config:
        from_attributes = True

# ===================== PROGRAM SCHEMAS =====================

class DersProgrami(BaseModel):
    ders_id: int
    sinif_id: int
    ogretmen_mail: Optional[str] = None
    gun: str
    baslangic: str
    bitis: str

class ProgramGuncelle(BaseModel):
    ders_id: Optional[int] = None
    sinif_id: Optional[int] = None
    ogretmen_mail: Optional[str] = None  # ✅ ogretmen_id → ogretmen_mail
    gun: Optional[str] = None
    baslangic: Optional[str] = None
    bitis: Optional[str] = None
    aktif: Optional[bool] = None

class ProgramResponse(BaseModel):
    id: int
    ders_id: int
    sinif_id: int
    ogretmen_mail: Optional[str] = None  # ✅ ogretmen_id → ogretmen_mail
    gun: str
    baslangic: time
    bitis: time
    aktif: bool
    ders_adi: Optional[str] = None
    sinif_adi: Optional[str] = None

    class Config:
        from_attributes = True

# ===================== YOKLAMA SCHEMAS =====================

class YoklamaEkle(BaseModel):
    ogrenci_id: int
    ders_id: int
    sinif_id: int
    device_fingerprint: Optional[str] = None
    konum: Optional[dict] = None

    class Config:
        from_attributes = True

class YoklamaSubmit(BaseModel):
    qr_data: str
    sinif_id: int
    device_fingerprint: str
    konum: Optional[dict] = None

class YoklamaResponse(BaseModel):
    id: int
    ogrenci_id: int
    ders_id: int
    sinif_id: int
    zaman: datetime
    durum: str
    ogrenci_adi: Optional[str] = None
    ders_adi: Optional[str] = None

    class Config:
        from_attributes = True

class YoklamaStats(BaseModel):
    toplam_ders: int
    katilim_sayisi: int
    devamsizlik_sayisi: int
    gecikme_sayisi: int
    katilim_orani: float

# ===================== QR KOD SCHEMAS =====================

class QRKodResponse(BaseModel):
    id: int
    sinif_id: int
    qr_data: str
    olusturma_tarihi: datetime

    class Config:
        from_attributes = True