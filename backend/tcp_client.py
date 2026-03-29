import socket

client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect(("127.0.0.1", 9000))

client.send("Merhaba Sunucu!".encode())
cevap = client.recv(1024).decode()
print(f"📩 Cevap: {cevap}")

client.close()