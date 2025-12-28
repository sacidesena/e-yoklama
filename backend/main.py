from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv
load_dotenv()

#test mail için ekliyorum
#from routes.test import router as test_router
#app.include_router(test_router)


# Router'ları import et
from routers import auth, users, siniflar, dersler, yoklama

# Database
from database import engine
from models import Base

# FastAPI app oluştur
app = FastAPI(
    title="Yoklama Sistemi API",
    description="QR kod tabanlı öğrenci yoklama sistemi",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS ayarları
#origins = [
    #"http://localhost:3000",
#   "http://localhost:5173",
    #"http://127.0.0.1:3000",
#    "http://127.0.0.1:5173",
    # Production domain buraya]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tüm originlere izin (geliştirme için)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Database tablolarını oluştur
@app.on_event("startup")
async def startup_event():
    """Uygulama başlatıldığında database tablolarını oluştur"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database bağlantısı başarılı!")
    print("✅ Tablolar kontrol edildi/oluşturuldu")
    print(f"📡 API Docs: http://localhost:8000/docs")

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"❌ Hata: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."}
    )

# Router'ları ekle
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(siniflar.router)
app.include_router(dersler.router)
app.include_router(yoklama.router)

# Ana endpoint
@app.get("/")
async def root():
    return {
        "message": "Yoklama Sistemi API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "active"
    }

# Health check
@app.get("/health")
async def health_check():
    try:
        # Database bağlantısını test et
        from sqlalchemy import text
        from database import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

# API bilgisi
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

# Development için
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )