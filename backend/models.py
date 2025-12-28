from sqlalchemy import (
    Column, Integer, String, ForeignKey,
    Time, Index, DateTime, Boolean
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# ===================== KULLANICI =====================

class Kullanici(Base):
    __tablename__ = "kullanicilar"

    id = Column(Integer, primary_key=True, index=True)
    mail = Column(String(255), unique=True, nullable=False, index=True)
    ad = Column(String(255), nullable=False)
    rol = Column(String(50), nullable=False)  # ogrenci / ogretmen / admin
    sifre_hash = Column(String(255), nullable=False)
    aktif = Column(Boolean, default=True)
    
    # YENİ ALANLAR (Güvenlik için)
    ogrenci_no = Column(String(50), unique=True, nullable=True, index=True)  # Sadece öğrenciler için
    device_fingerprint = Column(String(255), nullable=True)
    son_giris = Column(DateTime, nullable=True)
    kayit_tarihi = Column(DateTime, default=datetime.utcnow)
    
    # İlişkiler
    yoklamalar = relationship("Yoklama", back_populates="ogrenci", foreign_keys="[Yoklama.ogrenci_id]")
    #programlar = relationship("Program", back_populates="ogretmen")

# ===================== SINIF =====================

class Sinif(Base):
    __tablename__ = "siniflar"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ad = Column(String(255), nullable=False)
    
    # İlişkiler
    programlar = relationship("Program", back_populates="sinif")
    qr_kod = relationship("QRKod", back_populates="sinif", uselist=False)

# ===================== DERS =====================

class Ders(Base):
    __tablename__ = "dersler"

    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String(255), nullable=False, unique=True)
    
    # İlişkiler
    programlar = relationship("Program", back_populates="ders")

# ===================== DERS PROGRAMI =====================

class Program(Base):
    __tablename__ = "program"

    __table_args__ = (
        Index("idx_sinif_gun_zaman", "sinif_id", "gun", "baslangic", "bitis"),
    )

    id = Column(Integer, primary_key=True, index=True)
    ders_id = Column(Integer, ForeignKey("dersler.id"), nullable=False)
    sinif_id = Column(Integer, ForeignKey("siniflar.id"), nullable=False)
    #ogretmen_id = Column(Integer, ForeignKey("kullanicilar.id"), nullable=False)
    ogretmen_mail = Column(String(255), nullable=True) 
    gun = Column(String(50), nullable=False)
    baslangic = Column(Time, nullable=False)
    bitis = Column(Time, nullable=False)
    aktif = Column(Boolean, default=True)  # YENİ: Ders aktif mi?
    
    # İlişkiler
    ders = relationship("Ders", back_populates="programlar")
    sinif = relationship("Sinif", back_populates="programlar")
    #ogretmen = relationship("Kullanici", back_populates="programlar")

# ===================== YOKLAMA =====================

class Yoklama(Base):
    __tablename__ = "yoklamalar"

    __table_args__ = (
        Index("idx_ogrenci_ders", "ogrenci_id", "ders_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    ogrenci_id = Column(Integer, ForeignKey("kullanicilar.id"), nullable=False)
    ders_id = Column(Integer, ForeignKey("dersler.id"), nullable=False)
    sinif_id = Column(Integer, ForeignKey("siniflar.id"), nullable=False)
    zaman = Column(DateTime, default=datetime.utcnow)
    
    # YENİ ALANLAR
    durum = Column(String(20), default="Geldi")
    device_fingerprint = Column(String(255), nullable=True)
    konum = Column(String(100), nullable=True)
    
    # İlişkiler
    ogrenci = relationship("Kullanici", back_populates="yoklamalar", foreign_keys=[ogrenci_id])
# ===================== QR KOD =====================

class QRKod(Base):
    __tablename__ = "qr_kodlar"

    id = Column(Integer, primary_key=True, index=True)
    sinif_id = Column(Integer, ForeignKey("siniflar.id"), unique=True, nullable=False)
    qr_data = Column(String(255), nullable=False)
    dosya_yolu = Column(String(500), nullable=False)
    olusturma_tarihi = Column(DateTime, default=datetime.utcnow)
    guncelleme_tarihi = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # İlişkiler
    sinif = relationship("Sinif", back_populates="qr_kod")