from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Kullanici
from routers.auth import get_password_hash

# Router'ları import et
from routers import auth, users, siniflar, dersler, yoklama

# FastAPI app oluştur
app = FastAPI(
    title="E-Yoklama API",
    description="QR kod tabanlı öğrenci yoklama sistemi",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ============================================
# CORS - MUTLAKA ROUTE'LARDAN ÖNCE!
# ============================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Geliştirme ortamı için tüm originlere izin ver
    allow_credentials=False,  # allow_origins=["*"] ile credentials True olamaz
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Router'ları ekle
# ============================================
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(siniflar.router)
app.include_router(dersler.router)
app.include_router(yoklama.router)


# ============================================
# Database init & Startup
# ============================================
@app.on_event("startup")
async def startup_event():
    """Uygulama başlarken çalışır"""
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

    print("✅ Database bağlantısı başarılı!")
    print("👤 Varsayılan admin hazır")
    print("📡 API Docs: http://localhost:8000/docs")


# ============================================
# Global exception handler
# ============================================
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"❌ Hata: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."}
    )


# ============================================
# Endpoints
# ============================================
@app.get("/")
async def root():
    return {
        "message": "E-Yoklama API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "active"
    }


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
        "endpoints": {
            "auth": "/auth",
            "users": "/users",
            "siniflar": "/siniflar",
            "dersler": "/dersler",
            "yoklama": "/yoklama"
        },
        "features": [
            "JWT Authentication",
            "QR Code Generation",
            "Device Fingerprinting",
            "Real-time Attendance",
            "Statistics",
            "Role-based Access (Admin/Öğretmen/Öğrenci)"
        ],
        "database": "MySQL"
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)