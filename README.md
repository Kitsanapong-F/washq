# washq

```text
washq/
├── .github/
│   └── CODEOWNERS
├── frontend/                 # ระบบหน้าบ้าน (React + Vite/JS)
│   ├── public/               # ไฟล์ static เช่น รูปภาพ, favicon
│   ├── src/
│   │   ├── assets/           # ไฟล์รูปภาพหรือ CSS หลัก
│   │   ├── components/       # ปุ่ม, การ์ด, Header (UI reusable)
│   │   ├── pages/            # หน้าเว็บ (เช่น Home, Booking, QueueStatus)
│   │   ├── services/         # ฟังก์ชันเรียก API (fetch / axios)
│   │   ├── App.jsx           # Component หลัก
│   │   └── main.jsx          # จุดเริ่มต้นของ React
│   ├── package.json
│   └── index.html
├── api/                  # ระบบหลังบ้าน (Node.js + Express REST API)
│   ├── config/               # ไฟล์ตั้งค่า Database / Environment variables
│   ├── controllers/          # โค้ดจัดการ Logic ของแต่ละ API (เช่น การจองคิว)
│   ├── models/               # จัดการข้อมูล/ Query กับ Database
│   ├── routes/               # เส้นทาง API (เช่น /api/machines, /api/bookings)
│   ├── middlewares/          # ตัวกรอง request (เช่น ตรวจสอบ token / error handling)
│   ├── server.js             # จุดเริ่มต้นเปิดเซิร์ฟเวอร์ Express
│   └── package.json
├── .gitignore
└── README.md
```
