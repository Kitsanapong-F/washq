-- สร้างฐานข้อมูล washq_db
CREATE DATABASE IF NOT EXISTS washq_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE washq_db;

-- ลบตารางเก่า (ถ้ามี) เพื่อเตรียมโครงสร้างใหม่
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS machines;
DROP TABLE IF EXISTS users;

-- 1. ตาราง users (เก็บข้อมูลนักศึกษาและผู้ดูแลระบบ)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. ตาราง machines (เก็บข้อมูลและสถานะเครื่องซักผ้า)
CREATE TABLE machines (
    machine_id INT AUTO_INCREMENT PRIMARY KEY,
    machine_name VARCHAR(50) NOT NULL,
    type VARCHAR(50) DEFAULT 'ฝาหน้า 10kg',
    location VARCHAR(100) DEFAULT 'อาคาร 3 ชั้น 1',
    status ENUM('available', 'in_use', 'booked', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. ตาราง bookings (เก็บประวัติและรายการจองคิว)
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(20) NOT NULL UNIQUE, -- เช่น RES-9982
    user_id INT NOT NULL,
    machine_id INT NOT NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL, -- เช่น 14:00 - 15:00 น.
    status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_machine FOREIGN KEY (machine_id) REFERENCES machines(machine_id) ON DELETE CASCADE,

    -- Indexes สำหรับเพิ่มความเร็วในการ Query และเช็คคิวซ้ำ
    INDEX idx_user_active_booking (user_id, status),
    INDEX idx_machine_slot (machine_id, booking_date, time_slot, status)
) ENGINE=InnoDB;
