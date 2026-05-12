from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Ayarlar, Kullanici
from routers.auth import get_current_user
from schemas import MailAyarlariGuncelle, MailAyarlariResponse

router = APIRouter(prefix="/ayarlar", tags=["Ayarlar"])

def get_admin_user(current_user: Kullanici = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Yetkisiz")
    return current_user

@router.get("/mail",   response_model=MailAyarlariResponse)  # ← response_model ekle
def mail_ayarlarini_getir(
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_user)
):
    mail = db.query(Ayarlar).filter(Ayarlar.anahtar == "sender_email").first()
    return {
        "sender_email": mail.deger if mail else "",
        "sender_password": "••••••••" if mail else ""
    }

@router.put("/mail")
def mail_ayarlarini_guncelle(
    data: MailAyarlariGuncelle,  
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_user)
):
    for anahtar, deger in [
        ("sender_email", data.sender_email), 
        ("sender_password", data.sender_password)
    ]:
        if not deger:
            continue
        ayar = db.query(Ayarlar).filter(Ayarlar.anahtar == anahtar).first()
        if ayar:
            ayar.deger = deger
        else:
            db.add(Ayarlar(anahtar=anahtar, deger=deger))
    
    db.commit()
    return {"mesaj": "Mail ayarları güncellendi"}

@router.delete("/mail")
def mail_ayarlarini_temizle(
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_user)
):
    db.query(Ayarlar).filter(
        Ayarlar.anahtar.in_(["sender_email", "sender_password"])
    ).delete()
    db.commit()
    return {"mesaj": "Mail ayarları temizlendi"}