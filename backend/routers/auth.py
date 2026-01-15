from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os
import bcrypt


from database import get_db
from models import Kullanici
from schemas import LoginSchema, RegisterSchema, TokenResponse, TokenData, KullaniciResponse

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter(prefix="/auth", tags=["Authentication"])

# JWT ayarları
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7


def get_password_hash(password: str) -> str:
    # Şifreyi byte'a çevir
    password_bytes = password.encode('utf-8')
    # Salt oluştur ve hash'le
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz kimlik bilgileri",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        mail: str = payload.get("sub")
        if mail is None or payload.get("type") != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(Kullanici).filter(Kullanici.mail == mail).first()
    if user is None:
        raise credentials_exception
    return user

# Endpoints
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: RegisterSchema, db: Session = Depends(get_db)):
    # Email kontrolü
    existing_user = db.query(Kullanici).filter(Kullanici.mail == user_data.mail).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    
    # Öğrenci ise öğrenci no kontrolü
    if user_data.rol == "ogrenci" and user_data.ogrenci_no:
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
    
    # Token oluştur
    access_token = create_access_token(
        data={"sub": new_user.mail},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(data={"sub": new_user.mail})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Kullanici).filter(Kullanici.mail == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.sifre_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email veya şifre hatalı",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.aktif:
        raise HTTPException(status_code=400, detail="Hesap aktif değil")
    
    # Son giriş zamanını güncelle
    user.son_giris = datetime.utcnow()
    db.commit()
    
    # Token oluştur
    access_token = create_access_token(
        data={"sub": user.mail},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(data={"sub": user.mail})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        mail: str = payload.get("sub")
        if mail is None or payload.get("type") != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(Kullanici).filter(Kullanici.mail == mail).first()
    if user is None:
        raise credentials_exception
    
    # Yeni tokenlar oluştur
    new_access_token = create_access_token(
        data={"sub": user.mail},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    new_refresh_token = create_refresh_token(data={"sub": user.mail})
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=KullaniciResponse)
async def get_me(current_user: Kullanici = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "mail": current_user.mail,
        "ad": current_user.ad,
        "rol": current_user.rol,
        "aktif": current_user.aktif,
        "ogrenci_no": current_user.ogrenci_no,
        "son_giris": current_user.son_giris,
        "kayit_tarihi": current_user.kayit_tarihi
    }

@router.post("/logout")
async def logout(current_user: Kullanici = Depends(get_current_user)):
    return {"message": "Başarıyla çıkış yapıldı"}