FROM node:20-alpine

# Çalışma dizini
WORKDIR /app

# package.json dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları kur
RUN npm install

# Tüm frontend dosyaları
COPY . .

# Next.js portu
EXPOSE 3000

# Development modunda çalıştır
CMD ["npm", "run", "dev"]

#Bu Dockerfile development içindir. Production için next build + next start yapılır, onu sonra ekleriz.