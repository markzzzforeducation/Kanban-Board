# ใช้ Node.js 18 Alpine เป็น base image
FROM node:18-alpine

# ตั้ง working directory
WORKDIR /app

# คัดลอก package.json และ package-lock.json
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# คัดลอกไฟล์ทั้งหมด
COPY . .

# สร้างแอปพลิเคชัน
RUN npm run build

# เปิดพอร์ตที่แอปพลิเคชันจะรัน
EXPOSE 5173

# รันแอปพลิเคชัน
CMD ["npm", "run", "preview"]
