import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

# Email ayarları (Gmail örneği)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")  # yoklama@universite.edu
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")  # App password

def send_yoklama_list_to_teacher(
    hoca_mail: str,
    hoca_adi: str,
    ders_adi: str,
    ders_kodu: str,
    sinif_adi: str,
    tarih: datetime,
    baslangic: str,
    bitis: str,
    katilan_ogrenciler: list,
    katilmayan_ogrenciler: list
):
    """Hocaya yoklama listesi gönder"""
    
    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️ Email ayarları yapılmamış, mail gönderilemiyor")
        return False
    
    # Katılım oranı hesapla
    toplam = len(katilan_ogrenciler) + len(katilmayan_ogrenciler)
    katilim_orani = (len(katilan_ogrenciler) / toplam * 100) if toplam > 0 else 0
    
    # Email içeriği
    subject = f"Yoklama Listesi: {ders_adi} - {tarih.strftime('%d.%m.%Y %H:%M')}"
    
    # HTML içerik
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; }}
            .header {{ background-color: #667eea; color: white; padding: 20px; }}
            .content {{ padding: 20px; }}
            table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
            th {{ background-color: #667eea; color: white; padding: 10px; text-align: left; }}
            td {{ padding: 10px; border-bottom: 1px solid #ddd; }}
            .katildi {{ color: green; }}
            .katilmadi {{ color: red; }}
            .stats {{ background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h2>📋 Yoklama Listesi</h2>
        </div>
        
        <div class="content">
            <p><strong>Sayın {hoca_adi},</strong></p>
            
            <p>Aşağıda ders yoklama bilgileri yer almaktadır:</p>
            
            <div class="stats">
                <p><strong>🎓 Ders:</strong> {ders_adi} ({ders_kodu})</p>
                <p><strong>🏫 Sınıf:</strong> {sinif_adi}</p>
                <p><strong>📅 Tarih:</strong> {tarih.strftime('%d.%m.%Y %A')}</p>
                <p><strong>🕐 Saat:</strong> {baslangic} - {bitis}</p>
                <p><strong>✅ Katılan:</strong> {len(katilan_ogrenciler)}/{toplam}</p>
                <p><strong>❌ Katılmayan:</strong> {len(katilmayan_ogrenciler)}/{toplam}</p>
                <p><strong>📊 Katılım Oranı:</strong> %{katilim_orani:.1f}</p>
            </div>
            
            <h3 class="katildi">✅ Katılan Öğrenciler ({len(katilan_ogrenciler)})</h3>
            <table>
                <tr>
                    <th>No</th>
                    <th>Ad Soyad</th>
                    <th>Öğrenci No</th>
                    <th>Yoklama Zamanı</th>
                </tr>
    """
    
    # Katılan öğrenciler
    for i, ogrenci in enumerate(katilan_ogrenciler, 1):
        html_content += f"""
                <tr>
                    <td>{i}</td>
                    <td>{ogrenci['ad']}</td>
                    <td>{ogrenci['ogrenci_no']}</td>
                    <td>{ogrenci['zaman']}</td>
                </tr>
        """
    
    html_content += """
            </table>
            
            <h3 class="katilmadi">❌ Katılmayan Öğrenciler ({len(katilmayan_ogrenciler)})</h3>
            <table>
                <tr>
                    <th>No</th>
                    <th>Ad Soyad</th>
                    <th>Öğrenci No</th>
                </tr>
    """
    
    # Katılmayan öğrenciler
    for i, ogrenci in enumerate(katilmayan_ogrenciler, 1):
        html_content += f"""
                <tr>
                    <td>{i}</td>
                    <td>{ogrenci['ad']}</td>
                    <td>{ogrenci['ogrenci_no']}</td>
                </tr>
        """
    
    html_content += """
            </table>
            
            <hr>
            <p style="color: #666; font-size: 12px;">
                Bu mail otomatik olarak Yoklama Sistemi tarafından gönderilmiştir.<br>
                Üniversite Adı - Bilgi İşlem Daire Başkanlığı
            </p>
        </div>
    </body>
    </html>
    """
    
    try:
        # Email oluştur
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = SMTP_USER
        msg['To'] = hoca_mail
        
        # HTML içeriği ekle
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        # SMTP ile gönder
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Mail gönderildi: {hoca_mail}")
        return True
        
    except Exception as e:
        print(f"❌ Mail gönderme hatası: {str(e)}")
        return False