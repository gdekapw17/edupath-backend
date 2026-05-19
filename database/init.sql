-- Hapus tabel jika sudah ada untuk menghindari konflik saat re-inisialisasi
DROP TABLE IF EXISTS recommendation_careers CASCADE;
DROP TABLE IF EXISTS career_majors CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS careers CASCADE;
DROP TABLE IF EXISTS majors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Tabel Users
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_assessment_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Assessments (Telah di-flatten menjadi 14 metrik input AI)
CREATE TABLE assessments (
    assessment_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
    math_score FLOAT DEFAULT 0,
    physics_score FLOAT DEFAULT 0,
    chemistry_score FLOAT DEFAULT 0,
    biology_score FLOAT DEFAULT 0,
    history_score FLOAT DEFAULT 0,
    english_score FLOAT DEFAULT 0,
    geography_score FLOAT DEFAULT 0,
    weekly_self_study_hours INT DEFAULT 0,
    absence_days INT DEFAULT 0,
    science_avg FLOAT DEFAULT 0,
    social_avg FLOAT DEFAULT 0,
    overall_score FLOAT DEFAULT 0,
    part_time_job BOOLEAN DEFAULT FALSE,
    extracurricular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Recommendations (Tanpa cognitive_profile)
CREATE TABLE recommendations (
    recommendation_id VARCHAR(50) PRIMARY KEY,
    assessment_id VARCHAR(50) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    ai_summary TEXT,
    ai_explanation JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Careers (Kategori tersinkronisasi dengan model ML)
CREATE TABLE careers (
    career_id VARCHAR(50) PRIMARY KEY,
    career_name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT
);

-- 5. Tabel Majors
CREATE TABLE majors (
    major_id VARCHAR(50) PRIMARY KEY,
    major_name VARCHAR(100) NOT NULL,
    faculty VARCHAR(100) NOT NULL
);

-- 6. Tabel Relasi Career - Majors
CREATE TABLE career_majors (
    career_id VARCHAR(50) REFERENCES careers(career_id) ON DELETE CASCADE,
    major_id VARCHAR(50) REFERENCES majors(major_id) ON DELETE CASCADE,
    PRIMARY KEY (career_id, major_id)
);

-- 7. Tabel Relasi Recommendation - Careers
CREATE TABLE recommendation_careers (
    recommendation_id VARCHAR(50) REFERENCES recommendations(recommendation_id) ON DELETE CASCADE,
    career_id VARCHAR(50) REFERENCES careers(career_id) ON DELETE CASCADE,
    match_rank INT NOT NULL,
    confidence_score FLOAT,
    PRIMARY KEY (recommendation_id, career_id)
);

-- ==========================================
-- SEED DATA AWAL UNTUK PENGUJIAN
-- ==========================================

-- Seed Majors
INSERT INTO majors (major_id, major_name, faculty) VALUES
('MAJ-001', 'Sains Data', 'Fakultas Teknologi Informasi'),
('MAJ-002', 'Teknik Informatika', 'Fakultas Teknik'),
('MAJ-003', 'Pendidikan Dokter', 'Fakultas Kedokteran'),
('MAJ-004', 'Akuntansi', 'Fakultas Ekonomi dan Bisnis'),
('MAJ-005', 'Manajemen', 'Fakultas Ekonomi dan Bisnis'),
('MAJ-006', 'Ilmu Komunikasi', 'Fakultas Ilmu Komunikasi'),
('MAJ-007', 'Arsitektur', 'Fakultas Teknik'),
('MAJ-008', 'Desain Komunikasi Visual', 'Fakultas Seni Rupa dan Desain'),
('MAJ-009', 'Ilmu Administrasi Negara', 'Fakultas Ilmu Sosial dan Ilmu Politik'),
('MAJ-010', 'Pendidikan Guru', 'Fakultas Ilmu Pendidikan'),
('MAJ-011', 'Kewirausahaan', 'Fakultas Ekonomi dan Bisnis'),
('MAJ-012', 'Biologi', 'Fakultas MIPA');

-- Seed Careers (Tepat 2 profesi per kategori sesuai aturan sistem)
INSERT INTO careers (career_id, career_name, category, description) VALUES
('CAR-001', 'Data Scientist', 'Sains & Kedokteran', 'Menganalisis data mentah menjadi wawasan strategis untuk mendukung pengambilan keputusan.'),
('CAR-002', 'Software Engineer', 'Profesional & Keuangan', 'Membangun arsitektur perangkat lunak, peladen, dan aplikasi yang andal.'),
('CAR-003', 'Dokter Umum', 'Sains & Kedokteran', 'Mendiagnosis, merawat, dan mencegah penyakit serta menjaga kesehatan pasien.'),
('CAR-004', 'Financial Analyst', 'Profesional & Keuangan', 'Menganalisis data keuangan dan tren pasar untuk membantu keputusan investasi dan bisnis.'),
('CAR-005', 'Digital Marketer', 'Bisnis & Wirausaha', 'Merancang dan mengeksekusi kampanye pemasaran digital untuk meningkatkan jangkauan dan penjualan.'),
('CAR-006', 'Arsitek', 'Seni & Komunikasi', 'Merancang tata letak dan struktur bangunan yang estetis dan fungsional.'),
('CAR-007', 'Game Developer', 'Teknologi & Komputasi', 'Merancang dan mengembangkan mekanik, logika, dan pengalaman permainan digital.'),
('CAR-008', 'Cloud Engineer', 'Teknologi & Komputasi', 'Mengelola dan merancang infrastruktur komputasi awan yang aman dan scalable.'),
('CAR-009', 'Business Owner', 'Bisnis & Wirausaha', 'Membangun, mengelola, dan mengembangkan strategi bisnis serta operasional perusahaan.'),
('CAR-010', 'Graphic Designer', 'Seni & Komunikasi', 'Menciptakan solusi visual dan tata letak desain untuk media digital maupun cetak.'),
('CAR-011', 'Pegawai Pemerintahan', 'Sosial & Layanan Publik', 'Menjalankan fungsi administratif dan merumuskan kebijakan untuk pelayanan publik.'),
('CAR-012', 'Pengajar / Guru', 'Sosial & Layanan Publik', 'Mendidik, membimbing, dan mengevaluasi perkembangan peserta didik.');

-- Seed Relasi Career - Majors
INSERT INTO career_majors (career_id, major_id) VALUES
('CAR-001', 'MAJ-001'),
('CAR-002', 'MAJ-002'),
('CAR-003', 'MAJ-003'),
('CAR-004', 'MAJ-003'),
('CAR-005', 'MAJ-010'), 
('CAR-006', 'MAJ-005'),
('CAR-011', 'MAJ-009'),
('CAR-012', 'MAJ-010');

-- ==========================================
-- DATABASE OPTIMIZATION (INDEXING)
-- ==========================================

-- 1. Mempercepat pencarian profesi berdasarkan kategori dari model AI
CREATE INDEX idx_careers_category ON careers(category);

-- 2. Mempercepat pengambilan riwayat asesmen milik user tertentu
CREATE INDEX idx_assessments_user_id ON assessments(user_id);

-- 3. Mempercepat pencarian rekomendasi berdasarkan asesmen
CREATE INDEX idx_recommendations_assessment_id ON recommendations(assessment_id);

-- Catatan: recommendation_careers dan career_majors sudah otomatis memiliki indeks
-- karena mereka menggunakan Composite Primary Key.