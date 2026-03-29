import socket

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(("0.0.0.0", 9000))
server.listen(5)

print("✅ TCP Server dinliyor: port 9000")

while True:
    client, addr = server.accept()
    print(f"📡 Bağlandı: {addr}")

    data = client.recv(1024).decode()
    print(f"📨 Gelen mesaj: {data}")

    client.send("✅ Mesaj alındı".encode())
    client.close()