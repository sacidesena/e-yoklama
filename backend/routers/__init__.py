"""
Database'e örnek veri eklemek için script
Kullanım: python init_db.py
"""

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Kullanici, Sinif, Ders
from routers.auth import get_password_hash
from datetime import time

def init_database():
    """Database'i başlat ve örnek veriler ekle"""
    
    # Tabloları oluştur
    print("📦 Tablolar oluşturuluyor...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Örnek öğrenciler
        print("👨‍🎓 Örnek öğrenciler ekleniyor...")
        ogrenciler = [
            Kullanici(
                email="ahmet.yilmaz@example.com",
                hashed_password=get_password_hash("123456"),
                ogrenci_no="20210001",
                ad="Ahmet",
                soyad="Yılmaz",
                is_active=True
            ),
            Kullanici(
                email="ayse.demir@example.com",
                hashed_password=get_password_hash("123456"),
                ogrenci_no="20210002",
                ad="Ayşe",
                soyad="Demir",
                is_active=True
            ),
            Kullanici(
                email="mehmet.kaya@example.com",
                hashed_password=get_password_hash("123456"),
                ogrenci_no="20210003",
                ad="Mehmet",
                soyad="Kaya",
                is_active=True
            ),
            Kullanici(
                email="fatma.celik@example.com",
                hashed_password=get_password_hash("123456"),
                ogrenci_no="20210004",
                ad="Fatma",
                soyad="Çelik",
                is_active=True
            ),
        ]
        
        for ogrenci in ogrenciler:
            existing = db.query(Kullanici).filter(Kullanici.email == ogrenci.email).first()
            if not existing:
                db.add(ogrenci)
        
        db.commit()
        print(f"✅ {len(ogrenciler)} öğrenci eklendi")
        
        # Örnek sınıflar
        print("🏫 Örnek sınıflar ekleniyor...")
        siniflar = [
            Sinif(
                sinif_adi="Bilgisayar Mühendisliği 3-A",
                bolum="Bilgisayar Mühendisliği",
                sinif=3,
                sube="A"
            ),
            Sinif(
                sinif_adi="Yazılım Mühendisliği 2-B",
                bolum="Yazılım Mühendisliği",
                sinif=2,
                sube="B"
            ),
            Sinif(
                sinif_adi="Elektrik Elektronik Mühendisliği 1-A",
                bolum="Elektrik Elektronik Mühendisliği",
                sinif=1,
                sube="A"
            )
        ]
        
        for sinif in siniflar:
            existing = db.query(Sinif).filter(Sinif.sinif_adi == sinif.sinif_adi).first()
            if not existing:
                db.add(sinif)
        
        db.commit()
        print(f"✅ {len(siniflar)} sınıf eklendi")
        
        # Öğrencileri sınıflara ata
        print("📝 Öğrenciler sınıflara atanıyor...")
        sinif_bilgisayar = db.query(Sinif).filter(Sinif.sinif_adi == "Bilgisayar Mühendisliği 3-A").first()
        
        if sinif_bilgisayar:
            for ogrenci in db.query(Kullanici).limit(4).all():
                existing_relation = db.query(SinifOgrenci).filter(
                    SinifOgrenci.sinif_id == sinif_bilgisayar.id,
                    SinifOgrenci.kullanici_id == ogrenci.id
                ).first()
                
                if not existing_relation:
                    sinif_ogrenci = SinifOgrenci(
                        sinif_id=sinif_bilgisayar.id,
                        Kullanici_id=ogrenci.id
                    )
                    db.add(sinif_ogrenci)
            
            db.commit()
            print("✅ Öğrenciler sınıflara atandı")
        
        # Örnek dersler
        print("📚 Örnek dersler ekleniyor...")
        if sinif_bilgisayar:
            dersler = [
                Ders(
                    ders_adi="Veri Yapıları ve Algoritmalar",
                    ders_kodu="BIL-301",
                    sinif_id=sinif_bilgisayar.id,
                    gun="Pazartesi",
                    baslangic_saati=time(9, 0),
                    bitis_saati=time(10, 50),
                    aktif=True,
                    qr_data="DERS:BIL-301:" + str(sinif_bilgisayar.id)
                ),
                Ders(
                    ders_adi="Veritabanı Yönetim Sistemleri",
                    ders_kodu="BIL-302",
                    sinif_id=sinif_bilgisayar.id,
                    gun="Salı",
                    baslangic_saati=time(11, 0),
                    bitis_saati=time(12, 50),
                    aktif=True,
                    qr_data="DERS:BIL-302:" + str(sinif_bilgisayar.id)
                ),
                Ders(
                    ders_adi="Yazılım Mühendisliği",
                    ders_kodu="BIL-303",
                    sinif_id=sinif_bilgisayar.id,
                    gun="Çarşamba",
                    baslangic_saati=time(13, 0),
                    bitis_saati=time(14, 50),
                    aktif=True,
                    qr_data="DERS:BIL-303:" + str(sinif_bilgisayar.id)
                ),
                Ders(
                    ders_adi="İşletim Sistemleri",
                    ders_kodu="BIL-304",
                    sinif_id=sinif_bilgisayar.id,
                    gun="Perşembe",
                    baslangic_saati=time(9, 0),
                    bitis_saati=time(10, 50),
                    aktif=True,
                    qr_data="DERS:BIL-304:" + str(sinif_bilgisayar.id)
                ),
                Ders(
                    ders_adi="Web Programlama",
                    ders_kodu="BIL-305",
                    sinif_id=sinif_bilgisayar.id,
                    gun="Cuma",
                    baslangic_saati=time(11, 0),
                    bitis_saati=time(12, 50),
                    aktif=True,
                    qr_data="DERS:BIL-305:" + str(sinif_bilgisayar.id)
                )
            ]
            
            for ders in dersler:
                existing = db.query(Ders).filter(Ders.ders_kodu == ders.ders_kodu).first()
                if not existing:
                    db.add(ders)
            
            db.commit()
            print(f"✅ {len(dersler)} ders eklendi")
        
        print("\n" + "="*50)
        print("✅ Database başarıyla başlatıldı!")
        print("="*50)
        print("\n📊 Özet:")
        print(f"   👨‍🎓 Öğrenci sayısı: {db.query(Kullanici).count()}")
        print(f"   🏫 Sınıf sayısı: {db.query(Sinif).count()}")
        print(f"   📚 Ders sayısı: {db.query(Ders).count()}")
        print("\n🔑 Test Giriş Bilgileri:")
        print("   Email: ahmet.yilmaz@example.com")
        print("   Şifre: 123456")
        print("\n🌐 API Docs: http://localhost:8000/docs")
        print("="*50 + "\n")
        
    except Exception as e:
        print(f"❌ Hata oluştu: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()