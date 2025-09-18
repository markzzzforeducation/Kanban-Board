# ใช้ Node.js official image
FROM node:20-alpine

# ตั้ง working directory
WORKDIR /app

# คัดลอก package.json และ package-lock.json ก่อนเพื่อลดเวลา rebuild
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# คัดลอกไฟล์โปรเจคทั้งหมด
COPY . .

# build project สำหรับ production
RUN npm run build

# ใช้ Nginx serve static files
FROM nginx:alpine

# คัดลอกไฟล์ build ไปที่ Nginx
COPY --from=0 /app/dist /usr/share/nginx/html

# expose port 5173 (ตรงกับ docker-compose.yml)
EXPOSE 5173

# start Nginx
CMD ["nginx", "-g", "daemon off;"]
