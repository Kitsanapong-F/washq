USE washq_db;

-- ล้างข้อมูลเก่า
DELETE FROM bookings;
DELETE FROM machines;
DELETE FROM users;

-- Reset Auto Increment
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE machines AUTO_INCREMENT = 1;
ALTER TABLE bookings AUTO_INCREMENT = 1;

-- 1. เพิ่มข้อมูลผู้ใช้งานทดสอบ (รหัสผ่านคือ "123456" ที่ Hash แล้ว)
INSERT INTO users (student_code, password_hash, email, name, role) VALUES
('6512345678-9', '$2b$10$eImiTXuWVxfM37uY4JANjOL.8844ZXE.q7g61b8S.112233445566', 'somchai@rmutl.ac.th', 'สมชาย รักเรียน', 'student'),
('6512445890-1', '$2b$10$eImiTXuWVxfM37uY4JANjOL.8844ZXE.q7g61b8S.112233445566', 'somsri@rmutl.ac.th', 'สมศรี เรียนดี', 'student'),
('admin01', '$2b$10$eImiTXuWVxfM37uY4JANjOL.8844ZXE.q7g61b8S.112233445566', 'admin.laundry@rmutl.ac.th', 'อาจารย์ธนากร กวยพูน', 'admin');

-- 2. เพิ่มข้อมูลเครื่องซักผ้าประจำหอพัก (ตาม UI Admin)
INSERT INTO machines (machine_name, type, location, status) VALUES
('เครื่องซักผ้า 01', 'ฝาหน้า 10kg', 'อาคาร 3 ชั้น 1 (ชาย)', 'available'),
('เครื่องซักผ้า 02', 'ฝาหน้า 10kg', 'อาคาร 3 ชั้น 1 (ชาย)', 'in_use'),
('เครื่องซักผ้า 03', 'ฝาบน 12kg', 'อาคาร 3 ชั้น 2 (ชาย)', 'booked'),
('เครื่องซักผ้า 04', 'ฝาหน้า 10kg', 'อาคาร 3 ชั้น 2 (ชาย)', 'maintenance'),
('เครื่องซักผ้า 05', 'ฝาบน 14kg', 'อาคาร 4 ชั้น 1 (หญิง)', 'in_use'),
('เครื่องซักผ้า 06', 'ฝาบน 12kg', 'อาคาร 4 ชั้น 1 (หญิง)', 'available'),
('เครื่องซักผ้า 07', 'ฝาหน้า 10kg', 'อาคาร 4 ชั้น 2 (หญิง)', 'available'),
('เครื่องซักผ้า 08', 'ฝาบน 12kg', 'อาคาร 4 ชั้น 2 (หญิง)', 'maintenance');

-- 3. เพิ่มข้อมูลประวัติการจองคิวทดสอบ
INSERT INTO bookings (booking_code, user_id, machine_id, booking_date, time_slot, status) VALUES
('RES-9982', 1, 2, CURDATE(), '13:00 - 14:00 น.', 'active'),
('RES-9981', 2, 3, CURDATE(), '14:15 - 15:15 น.', 'active');
