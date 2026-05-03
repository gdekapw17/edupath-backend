-- EduPath Database Initialization Script
-- Version: 1.1 (JSONB & Multi-Career Recommendations)

-- 1. Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    school_name VARCHAR(255),
    is_assessment_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Careers Table
CREATE TABLE careers (
    career_id VARCHAR(50) PRIMARY KEY,
    career_name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    description TEXT
);

-- 3. Majors Table
CREATE TABLE majors (
    major_id VARCHAR(50) PRIMARY KEY,
    major_name VARCHAR(150) NOT NULL,
    faculty VARCHAR(100)
);

-- 4. Career-Majors Junction (Relasi Karir ke Jurusan N:M)
CREATE TABLE career_majors (
    career_id VARCHAR(50) REFERENCES careers(career_id) ON DELETE CASCADE,
    major_id VARCHAR(50) REFERENCES majors(major_id) ON DELETE CASCADE,
    PRIMARY KEY (career_id, major_id)
);

-- 5. Assessments Table
CREATE TABLE assessments (
    assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    raw_data JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Recommendations Table
CREATE TABLE recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID UNIQUE REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    cognitive_profile JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Recommendation-Careers Junction (Menyimpan 1 Utama & 2 Alternatif Karir)
CREATE TABLE recommendation_careers (
    recommendation_id UUID REFERENCES recommendations(recommendation_id) ON DELETE CASCADE,
    career_id VARCHAR(50) REFERENCES careers(career_id) ON DELETE CASCADE,
    match_rank INTEGER NOT NULL, 
    confidence_score FLOAT, 
    PRIMARY KEY (recommendation_id, career_id)
);