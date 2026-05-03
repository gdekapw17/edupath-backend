-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Sentral Pengguna
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    school_name VARCHAR(150),
    is_assessment_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indeks untuk mempercepat pencarian pengguna saat login
CREATE INDEX idx_users_email ON users(email);

-- 2. Tabel Master Katalog Karier (Dibuat sebelum rekomendasi agar bisa direferensikan)
CREATE TABLE careers (
    career_id VARCHAR(50) PRIMARY KEY,
    career_name VARCHAR(150) NOT NULL,
    category VARCHAR(100)
);

-- 3. Tabel Transaksional Asesmen
CREATE TABLE assessments (
    assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    math_score INT CHECK (math_score >= 0 AND math_score <= 100),
    physics_score INT CHECK (physics_score >= 0 AND physics_score <= 100),
    chemistry_score INT CHECK (chemistry_score >= 0 AND chemistry_score <= 100),
    biology_score INT CHECK (biology_score >= 0 AND biology_score <= 100),
    english_score INT CHECK (english_score >= 0 AND english_score <= 100),
    history_score INT CHECK (history_score >= 0 AND history_score <= 100),
    geography_score INT CHECK (geography_score >= 0 AND geography_score <= 100),
    weekly_self_study_hours INT CHECK (weekly_self_study_hours >= 0),
    absence_days INT CHECK (absence_days >= 0),
    part_time_job BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indeks untuk mempercepat kueri riwayat asesmen per pengguna
CREATE INDEX idx_assessments_user_id ON assessments(user_id);

-- 4. Tabel Hasil Prediksi AI
CREATE TABLE recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID UNIQUE NOT NULL REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    predicted_career_id VARCHAR(50) REFERENCES careers(career_id) ON DELETE SET NULL,
    confidence_score NUMERIC(5, 4), -- Membatasi desimal, misal: 0.9250
    analytical_thinking INT CHECK (analytical_thinking >= 0 AND analytical_thinking <= 100),
    problem_solving INT CHECK (problem_solving >= 0 AND problem_solving <= 100),
    creativity INT CHECK (creativity >= 0 AND creativity <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);