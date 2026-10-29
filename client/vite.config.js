import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // <-- เพิ่มบรรทัดนี้เข้าไปครับ เพื่อให้โหลดไฟล์ผ่าน path สัมพัทธ์ใน Electron ได้
  plugins: [react()],
})