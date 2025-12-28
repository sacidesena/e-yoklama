from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import time as dt_time

from database import get_db
from models import Ders, Sinif, Kullanici, Program
from schemas import DersEkle, DersGuncelle, DersResponse, DersProgrami, ProgramGuncelle, ProgramResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/dersler", tags=["Dersler"])

# Admin/Öğretmen kontrolü
async def get_admin_or_teacher(current_user: Kullanici = Depends(get_current_user)):
    if current_user.rol not in ["admin", "ogretmen"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    return current_user

# ===================== DERS CRUD =====================

@router.get("/", response_model=List[DersResponse])
async def list_dersler(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Tüm dersleri listele"""
    query = db.query(Ders)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(Ders.ad.like(search_filter))
    
    dersler = query.offset(skip).limit(limit).all()
    return dersler

@router.get("/{ders_id}", response_model=DersResponse)
async def get_ders(
    ders_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Belirli bir dersin bilgilerini getir"""
    ders = db.query(Ders).filter(Ders.id == ders_id).first()
    
    if not ders:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    
    return ders

@router.post("/", response_model=DersResponse, status_code=status.HTTP_201_CREATED)
async def create_ders(
    ders_data: DersEkle,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_or_teacher)
):
    """Yeni ders oluştur"""
    existing = db.query(Ders).filter(Ders.ad == ders_data.ad).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"'{ders_data.ad}' isimli ders zaten mevcut"
        )
    
    new_ders = Ders(ad=ders_data.ad)
    
    db.add(new_ders)
    db.commit()
    db.refresh(new_ders)
    
    return new_ders

@router.put("/{ders_id}", response_model=DersResponse)
async def update_ders(
    ders_id: int,
    ders_data: DersGuncelle,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_or_teacher)
):
    """Ders bilgilerini güncelle"""
    ders = db.query(Ders).filter(Ders.id == ders_id).first()
    
    if not ders:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    
    if ders_data.ad and ders_data.ad != ders.ad:
        existing = db.query(Ders).filter(
            Ders.ad == ders_data.ad,
            Ders.id != ders_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"'{ders_data.ad}' isimli ders zaten mevcut"
            )
        ders.ad = ders_data.ad
    
    db.commit()
    db.refresh(ders)
    
    return ders

@router.delete("/{ders_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ders(
    ders_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_or_teacher)
):
    """Dersi sil"""
    ders = db.query(Ders).filter(Ders.id == ders_id).first()
    
    if not ders:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    
    # Derse bağlı program var mı kontrol et
    program_count = db.query(Program).filter(Program.ders_id == ders_id).count()
    if program_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Bu derse ait programlar var. Önce programları silin."
        )
    
    db.delete(ders)
    db.commit()
    
    return None

# ===================== DERS PROGRAMI =====================

@router.get("/program/all", response_model=List[ProgramResponse])
async def list_program(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    sinif_id: Optional[int] = None,
    ders_id: Optional[int] = None,
    gun: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Tüm ders programlarını listele"""
    query = db.query(Program)
    
    if sinif_id:
        query = query.filter(Program.sinif_id == sinif_id)
    if ders_id:
        query = query.filter(Program.ders_id == ders_id)
    if gun:
        query = query.filter(Program.gun == gun)
    
    programlar = query.offset(skip).limit(limit).all()
    
    # Ek bilgiler ekle
    result = []
    for prog in programlar:
        ders = db.query(Ders).filter(Ders.id == prog.ders_id).first()
        sinif = db.query(Sinif).filter(Sinif.id == prog.sinif_id).first()
        ogretmen = db.query(Kullanici).filter(Kullanici.id == prog.ogretmen_id).first()
        
        result.append({
            "id": prog.id,
            "ders_id": prog.ders_id,
            "sinif_id": prog.sinif_id,
            "ogretmen_id": prog.ogretmen_id,
            "gun": prog.gun,
            "baslangic": prog.baslangic,
            "bitis": prog.bitis,
            "aktif": prog.aktif,
            "ders_adi": ders.ad if ders else None,
            "sinif_adi": sinif.ad if sinif else None,
            "ogretmen_adi": ogretmen.ad if ogretmen else None
        })
    
    return result

@router.post("/program", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
async def create_program(
    program_data: DersProgrami,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_or_teacher)
):
    """Yeni ders programı oluştur"""
    # Ders var mı?
    ders = db.query(Ders).filter(Ders.id == program_data.ders_id).first()
    if not ders:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    
    # Sınıf var mı?
    sinif = db.query(Sinif).filter(Sinif.id == program_data.sinif_id).first()
    if not sinif:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")
    
    # Öğretmen var mı?
    ogretmen = db.query(Kullanici).filter(
        Kullanici.id == program_data.ogretmen_id,
        Kullanici.rol == "ogretmen"
    ).first()
    if not ogretmen:
        raise HTTPException(status_code=404, detail="Öğretmen bulunamadı")
    
    # Saat parse et
    try:
        baslangic = dt_time.fromisoformat(program_data.baslangic)
        bitis = dt_time.fromisoformat(program_data.bitis)
    except ValueError:
        raise HTTPException(status_code=400, detail="Geçersiz saat formatı (HH:MM kullanın)")
    
    # Saat çakışması kontrolü
    cakisan = db.query(Program).filter(
        Program.sinif_id == program_data.sinif_id,
        Program.gun == program_data.gun,
        Program.aktif == True,
        (
            ((Program.baslangic <= baslangic) & (Program.bitis > baslangic)) |
            ((Program.baslangic < bitis) & (Program.bitis >= bitis)) |
            ((Program.baslangic >= baslangic) & (Program.bitis <= bitis))
        )
    ).first()
    
    if cakisan:
        raise HTTPException(
            status_code=400,
            detail="Bu saatte çakışan bir ders var"
        )
    
    # Yeni program oluştur
    new_program = Program(
        ders_id=program_data.ders_id,
        sinif_id=program_data.sinif_id,
        #ogretmen_id=program_data.ogretmen_id,
        ogretmen_mail=program_data.ogretmen_mail,
        gun=program_data.gun,
        baslangic=baslangic,
        bitis=bitis,
        aktif=True
    )
    
    db.add(new_program)
    db.commit()
    db.refresh(new_program)
    
    return {
        "id": new_program.id,
        "ders_id": new_program.ders_id,
        "sinif_id": new_program.sinif_id,
        #"ogretmen_id": new_program.ogretmen_id,
        "ogretmen_mail": new_program.ogretmen_mail,
        "gun": new_program.gun,
        "baslangic": new_program.baslangic,
        "bitis": new_program.bitis,
        "aktif": new_program.aktif,
        "ders_adi": ders.ad,
        "sinif_adi": sinif.ad,
        "ogretmen_adi": ogretmen.ad
    }

@router.get("/program/{program_id}", response_model=ProgramResponse)
async def get_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_current_user)
):
    """Belirli bir programı getir"""
    program = db.query(Program).filter(Program.id == program_id).first()
    
    if not program:
        raise HTTPException(status_code=404, detail="Program bulunamadı")
    
    ders = db.query(Ders).filter(Ders.id == program.ders_id).first()
    sinif = db.query(Sinif).filter(Sinif.id == program.sinif_id).first()
    ogretmen = db.query(Kullanici).filter(Kullanici.id == program.ogretmen_id).first()
    
    return {
        "id": program.id,
        "ders_id": program.ders_id,
        "sinif_id": program.sinif_id,
        "ogretmen_id": program.ogretmen_id,
        "gun": program.gun,
        "baslangic": program.baslangic,
        "bitis": program.bitis,
        "aktif": program.aktif,
        "ders_adi": ders.ad if ders else None,
        "sinif_adi": sinif.ad if sinif else None,
        "ogretmen_adi": ogretmen.ad if ogretmen else None
    }

@router.put("/program/{program_id}", response_model=ProgramResponse)
async def update_program(
    program_id: int,
    program_data: ProgramGuncelle,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_or_teacher)
):
    """Program bilgilerini güncelle"""
    program = db.query(Program).filter(Program.id == program_id).first()
    
    if not program:
        raise HTTPException(status_code=404, detail="Program bulunamadı")
    
    # Güncellemeleri uygula
    if program_data.ders_id is not None:
        program.ders_id = program_data.ders_id
    if program_data.sinif_id is not None:
        program.sinif_id = program_data.sinif_id
    if program_data.ogretmen_id is not None:
        program.ogretmen_id = program_data.ogretmen_id
    if program_data.gun is not None:
        program.gun = program_data.gun
    if program_data.baslangic is not None:
        program.baslangic = dt_time.fromisoformat(program_data.baslangic)
    if program_data.bitis is not None:
        program.bitis = dt_time.fromisoformat(program_data.bitis)
    if program_data.aktif is not None:
        program.aktif = program_data.aktif
    
    db.commit()
    db.refresh(program)
    
    ders = db.query(Ders).filter(Ders.id == program.ders_id).first()
    sinif = db.query(Sinif).filter(Sinif.id == program.sinif_id).first()
    ogretmen = db.query(Kullanici).filter(Kullanici.id == program.ogretmen_id).first()
    
    return {
        "id": program.id,
        "ders_id": program.ders_id,
        "sinif_id": program.sinif_id,
        "ogretmen_id": program.ogretmen_id,
        "gun": program.gun,
        "baslangic": program.baslangic,
        "bitis": program.bitis,
        "aktif": program.aktif,
        "ders_adi": ders.ad if ders else None,
        "sinif_adi": sinif.ad if sinif else None,
        "ogretmen_adi": ogretmen.ad if ogretmen else None
    }

@router.delete("/program/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: Kullanici = Depends(get_admin_or_teacher)
):
    """Programı sil"""
    program = db.query(Program).filter(Program.id == program_id).first()
    
    if not program:
        raise HTTPException(status_code=404, detail="Program bulunamadı")
    
    db.delete(program)
    db.commit()
    
    return None