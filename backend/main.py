from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.exc import IntegrityError
import pytz
load_dotenv()

from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Kullanici, Program, Yoklama, Ders, Sinif, MailLog
from routers.auth import get_password_hash
from utils.email_sender import send_yoklama_list_to_teacher

from routers import auth, users, siniflar, dersler, yoklama

app = FastAPI(
    title="E-Yoklama API",
    description="QR kod tabanlı öğrenci yoklama sistemi",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(siniflar.router)
app.include_router(dersler.router)
app.include_router(yoklama.router)


# ============================================
# SCHEDULER
# ============================================

TZ = pytz.timezone("Europe/Istanbul")

async def ders_bitis_kontrol():
    import asyncio
    
    with SessionLocal() as db:
        try:
            simdi = datetime.now(TZ)
            bugun = simdi.date()
            gun_isimleri = {
                0: "Pazartesi", 1: "Salı", 2: "Çarşamba",
                3: "Perşembe", 4: "Cuma", 5: "Cumartesi", 6: "Pazar"
            }
            bugun_adi = gun_isimleri[simdi.weekday()]

            programlar = db.query(Program).filter(
                Program.gun == bugun_adi,
                Program.aktif == True
            ).all()

            for program in programlar:
                mail_gonderildi = db.query(MailLog).filter(
                    MailLog.program_id == program.id,
                    MailLog.gonderim_tarihi == bugun
                ).first()

                if mail_gonderildi:
                    continue

                # ✅ TZ-aware datetime.combine
                bitis_datetime = TZ.localize(datetime.combine(bugun, program.bitis))
                bitis_plus_5 = bitis_datetime + timedelta(minutes=5)

                if simdi < bitis_plus_5:
                    continue

                ders = db.query(Ders).filter(Ders.id == program.ders_id).first()
                sinif = db.query(Sinif).filter(Sinif.id == program.sinif_id).first()

                if not ders or not ders.hoca_mail:
                    print(f"⚠️ Program {program.id} için hoca maili yok, atlanıyor")
                    try:
                        log = MailLog(program_id=program.id, gonderim_tarihi=bugun)
                        db.add(log)
                        db.commit()
                    except IntegrityError:
                        db.rollback()
                    continue

                bugun_start = TZ.localize(datetime.combine(bugun, datetime.min.time()))
                bugun_end = TZ.localize(datetime.combine(bugun, datetime.max.time()))

                yoklamalar = db.query(Yoklama).filter(
                    Yoklama.ders_id == program.ders_id,
                    Yoklama.sinif_id == program.sinif_id,
                    Yoklama.zaman >= bugun_start,
                    Yoklama.zaman <= bugun_end
                ).all()

                katilan_ids = [y.ogrenci_id for y in yoklamalar]
                if katilan_ids:
                  ogrenciler = db.query(Kullanici).filter(
                      Kullanici.id.in_(katilan_ids)).all()
                else:
                   ogrenciler = []
                ogrenci_map = {o.id: o for o in ogrenciler}

                katilan_ogrenciler = []
                for y in yoklamalar:
                    ogrenci = ogrenci_map.get(y.ogrenci_id)
                    if ogrenci:
                        katilan_ogrenciler.append({
                            'ad': ogrenci.ad,
                            'ogrenci_no': ogrenci.ogrenci_no or '-',
                            'zaman': y.zaman.strftime('%H:%M')
                        })

                # ✅ DB tarafında filtrele
                katilmayan_ogrenciler_db = db.query(Kullanici).filter(
                    Kullanici.rol == "ogrenci",
                    ~Kullanici.id.in_(katilan_ids)
                ).all()
                katilmayan_ogrenciler = [
                    {'ad': ogr.ad, 'ogrenci_no': ogr.ogrenci_no or '-'}
                    for ogr in katilmayan_ogrenciler_db
                ]

                print(f"📧 Mail gönderiliyor: {ders.ad} → {ders.hoca_mail}")

                # ✅ Async mail gönder - scheduler bloklanmaz
                success = await asyncio.to_thread(
                    send_yoklama_list_to_teacher,
                    hoca_mail=ders.hoca_mail,
                    hoca_adi=ders.hoca_adi or "Değerli Hocam",
                    ders_adi=ders.ad,
                    ders_kodu=ders.kod or "",
                    sinif_adi=sinif.ad if sinif else "Bilinmiyor",
                    tarih=simdi,  # ✅ timezone bilgisi korundu
                    baslangic=program.baslangic.strftime('%H:%M'),
                    bitis=program.bitis.strftime('%H:%M'),
                    katilan_ogrenciler=katilan_ogrenciler,
                    katilmayan_ogrenciler=katilmayan_ogrenciler
                )

                try:
                    log = MailLog(program_id=program.id, gonderim_tarihi=bugun)
                    db.add(log)
                    db.commit()
                    if success:
                        print(f"✅ Mail gönderildi: {ders.hoca_mail}")
                    else:
                        print(f"❌ Mail gönderilemedi: {ders.hoca_mail}")
                except IntegrityError:
                    db.rollback()
                    print(f"⚠️ Duplicate engellendi: program {program.id}")

        except Exception as e:
            print(f"❌ Scheduler hatası: {e}")
            import traceback
            traceback.print_exc()


# ============================================
# Database init & Startup
# ============================================
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    print("✅ Tablolar kontrol ediliyor...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        admin = db.query(Kullanici).filter(Kullanici.mail == "admin@yoklama.com").first()
        if not admin:
            admin = Kullanici(
                mail="admin@yoklama.com",
                ad="Admin",
                rol="admin",
                sifre_hash=get_password_hash("Admin123!"),
                aktif=True
            )
            db.add(admin)
            db.commit()
            print("✅ İlk admin oluşturuldu: admin@yoklama.com")
        else:
            print("ℹ️ Admin zaten mevcut")
    finally:
        db.close()

    scheduler.add_job(ders_bitis_kontrol, 'interval', minutes=1)
    scheduler.start()
    print("✅ Scheduler başlatıldı")
    print("✅ Database bağlantısı başarılı!")
    print("📡 API Docs: http://localhost:8000/docs")


@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    print("🛑 Scheduler durduruldu")


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"❌ Hata: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."}
    )


@app.get("/")
async def root():
    return {"message": "E-Yoklama API", "version": "1.0.0", "docs": "/docs", "status": "active"}


@app.get("/health")
async def health_check():
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


@app.get("/api/info")
async def api_info():
    return {
        "endpoints": {"auth": "/auth", "users": "/users", "siniflar": "/siniflar", "dersler": "/dersler", "yoklama": "/yoklama"},
        "database": "MySQL"
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)