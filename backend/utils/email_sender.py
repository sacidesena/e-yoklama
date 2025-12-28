import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_email(to_email: str, subject: str, body: str):
    """Email gönder"""
    try:
        # SMTP ayarları (Gmail örneği)
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        sender_email = os.getenv("SENDER_EMAIL")
        sender_password = os.getenv("SENDER_PASSWORD")
        
        if not sender_email or not sender_password:
            print("Email gönderimi için SMTP bilgileri eksik!")
            return False
        
        # Email oluştur
        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = to_email
        message["Subject"] = subject
        
        message.attach(MIMEText(body, "html"))
        
        # SMTP ile gönder
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(message)
        
        print(f"✅ Email gönderildi: {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Email gönderimi hatası: {e}")
        return False

def send_yoklama_notification(
    ogretmen_mail: str,
    ogrenci_adi: str,
    ders_adi: str,
    sinif_adi: str,
    durum: str,
    zaman: str
):
    """Yoklama bildirimi gönder"""
    subject = f"Yoklama Bildirimi - {ders_adi}"
    
    body = f"""
    <html>
        <body>
            <h2>Yoklama Bildirimi</h2>
            <p><strong>Öğrenci:</strong> {ogrenci_adi}</p>
            <p><strong>Ders:</strong> {ders_adi}</p>
            <p><strong>Sınıf:</strong> {sinif_adi}</p>
            <p><strong>Durum:</strong> {durum}</p>
            <p><strong>Zaman:</strong> {zaman}</p>
            <hr>
            <p style="color: gray; font-size: 12px;">
                Bu mail otomatik olarak yoklama sistemi tarafından gönderilmiştir.
            </p>
        </body>
    </html>
    """
    
    return send_email(ogretmen_mail, subject, body)