FROM node:20-alpine

# Çalışma dizini
WORKDIR /app

# package.json dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları kur
RUN npm install

# Tüm frontend dosyaları
COPY . .

# Next.js portu 3000
#vite 
EXPOSE 5173

# Development modunda çalıştır
CMD ["npm", "run", "dev","--", "--host", "0.0.0.0"]

#Bu Dockerfile development içindir. Production için next build + next start yapılır, onu sonra ekleriz.