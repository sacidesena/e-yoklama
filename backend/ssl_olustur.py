from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import datetime

def generate_self_signed_cert():
    # 1. Private Key oluştur
    key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )

    # 2. Sertifika bilgilerini ayarla
    subject = issuer = x509.Name([
        x509.NameAttribute(x509.NameOID.COUNTRY_NAME, u"TR"),
        x509.NameAttribute(x509.NameOID.STATE_OR_PROVINCE_NAME, u"Ankara"),
        x509.NameAttribute(x509.NameOID.ORGANIZATION_NAME, u"YoklamaSistemi"),
        x509.NameAttribute(x509.NameOID.COMMON_NAME, u"192.168.1.34"),
    ])

    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.utcnow()
    ).not_valid_after(
        # 1 yıl geçerli
        datetime.datetime.utcnow() + datetime.timedelta(days=365)
    ).add_extension(
        x509.SubjectAlternativeName([x509.DNSName(u"localhost"), x509.IPAddress(import_ip_address("192.168.1.34"))]),
        critical=False,
    ).sign(key, hashes.SHA256(), default_backend())

    # 3. Dosyaları kaydet
    with open("key.pem", "wb") as f:
        f.write(key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        ))
    
    with open("cert.pem", "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))

    print("✅ Sertifikalar oluşturuldu: key.pem ve cert.pem")

def import_ip_address(ip):
    import ipaddress
    return ipaddress.ip_address(ip)

if __name__ == "__main__":
    # Eğer cryptography kütüphanesi yoksa önce yükle: pip install cryptography
    try:
        generate_self_signed_cert()
    except ImportError:
        print("Lütfen önce kütüphaneyi yükle: pip install cryptography")