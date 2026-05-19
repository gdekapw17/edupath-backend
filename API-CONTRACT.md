# EduPath API Contract

- **Base URL:** `https://api.edupath.com/api/v1` (Production) / `http://localhost:3000/api/v1` (Development)
- **Content-Type:** `application/json`

## Global Error Responses

Untuk menjaga agar dokumen tetap ringkas, format respons _error_ di bawah ini berlaku secara global untuk seluruh sistem, kecuali jika ada format _error_ spesifik yang didefinisikan pada masing-masing _endpoint_.

**400 Bad Request (Common Validation Errors)**
Berlaku ketika ada field input yang kosong atau formatnya tidak sesuai (misal: format email salah).

```json
{
  "success": false,
  "message": "Input validation failed",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "math_score",
        "message": "Nilai Matematika tidak boleh lebih dari 100"
      }
    ]
  }
}
```

**401 Unauthorized (Expired/Invalid Token)**
Berlaku secara mutlak untuk seluruh endpoint yang memiliki status Access: Private.

```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "details": "Access token is missing, invalid, or has expired."
  }
}
```

**429 Too Many Request (Rate Limit Exceeded)**
Berlaku jika IP pengguna melakukan spam request melebihi batas (terutama pada endpoint AI).

```json
{
  "success": false,
  "message": "Too many prediction requests.",
  "data": null,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "details": "The system has detected too many requests from your IP. Please try again after 15 minute"
  }
}
```

**500 Internal Server Error (System Failure)**
Berlaku untuk semua endpoint jika terjadi kegagalan koneksi ke basis data PostgreSQL atau terputusnya komunikasi dengan peladen AI.

```json
{
  "success": false,
  "message": "Internal server error",
  "data": null,
  "error": {
    "code": "SERVER_ERROR",
    "details": "An unexpected error occurred on the server."
  }
}
```

---

## 1. Authentication Module

Modul ini menangani proses pendaftaran siswa baru dan penerbitan token akses untuk sesi login pengguna.

### 1.1. Register User

Mendaftarkan akun siswa baru ke dalam sistem.

- **Endpoint:** `POST /auth/register`
- **Access:** Public

**Request Body:**

```json
{
  "email": "siswa@example.com",
  "password": "SecurePassword123!",
  "full_name": "Budi Santoso",
  "school_name": "SMA Negeri 1 Jakarta"
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": "uuid-v4-string",
    "email": "siswa@example.com",
    "full_name": "Budi Santoso",
    "school_name": "SMA Negeri 1 Jakarta",
    "created_at": "2026-05-03T10:00:00Z"
  },
  "error": null
}
```

**Error Response (400 Bad Request - Email already exists):**

```json
{
  "success": false,
  "message": "Registration failed",
  "data": null,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "details": "The email provided is already registered in the system."
  }
}
```

### 1.2. Login User

Mengautentikasi pengguna dan mengembalikan token akses (JWT) yang akan digunakan untuk mengakses endpoint privat.

- **Endpoint:** `POST /auth/login`
- **Access:** Public

**Request Body:**

```json
{
  "email": "siswa@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "expires_in": 86400,
    "user": {
      "user_id": "uuid-v4-string",
      "email": "siswa@example.com",
      "full_name": "Budi Santoso"
    }
  },
  "error": null
}
```

**Error Response (401 Unauthorized - Invalid Credentials):**

```json
{
  "success": false,
  "message": "Authentication failed",
  "data": null,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "details": "Invalid email or password."
  }
}
```

## 2. User Profile Module

Modul ini mengelola data profil siswa. Semua endpoint di modul ini bersifat privat dan mewajibkan penyertaan token akses (JWT) pada _header_ permintaan.

### 2.1. Get Current User Profile

Mengambil detail profil dari siswa yang sedang terautentikasi.

- **Endpoint:** `GET /profiles/me`
- **Access:** Private
- **Headers:** `Authorization: Bearer <access_token>`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user_id": "uuid-v4-string",
    "email": "siswa@example.com",
    "full_name": "Budi Santoso",
    "school_name": "SMA Negeri 1 Jakarta",
    "is_assessment_completed": false
  },
  "error": null
}
```

### 2.2. Update User Profile

Memperbarui informasi profil siswa, misalnya jika ada kesalahan ketik pada nama asal sekolah.

- **Endpoint:** `PUT /profiles/me`
- **Access:** Private
- **Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "full_name": "Budi Santoso",
  "school_name": "SMA Negeri 1 Jakarta Pusat"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user_id": "uuid-v4-string",
    "email": "siswa@example.com",
    "full_name": "Budi Santoso",
    "school_name": "SMA Negeri 1 Jakarta Pusat",
    "updated_at": "2026-05-03T11:00:00Z"
  },
  "error": null
}
```

**Error Response (400 Bad Request - Validation Error):**

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": "The 'school_name' field cannot be empty."
  }
}
```

## 3. Assessment & Academic Data Module

Modul ini mengelola pengiriman dan riwayat data akademik serta perilaku belajar siswa yang akan menjadi _input_ untuk model prediktif.

### 3.1. Submit Assessment

Menyimpan data nilai akademik dan metrik perilaku siswa. Endpoint ini akan mengembalikan ID asesmen yang nantinya digunakan untuk memicu proses prediksi karier.

- **Endpoint:** `POST /assessments`
- **Access:** Private
- **Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "math_score": 85.0,
  "physics_score": 80.0,
  "chemistry_score": 78.0,
  "biology_score": 72.0,
  "history_score": 68.0,
  "english_score": 75.0,
  "geography_score": 70.0,
  "weekly_self_study_hours": 20,
  "absence_days": 3,
  "part_time_job": false,
  "extracurricular": true
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Assessment data submitted successfully",
  "data": {
    "assessment_id": "assess-uuid-v4",
    "user_id": "uuid-v4-string",
    "created_at": "2026-05-03T12:00:00Z"
  }
}
```

### 3.2. Get Assessment History

Mengambil riwayat asesmen yang pernah diisi oleh siswa.

- **Endpoint:** `GET /assessments`
- **Access:** Private
- **Headers:** `Authorization: Bearer <access_token>`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Assessment history retrieved successfully",
  "data": [
    {
      "assessment_id": "assess-uuid-v4",
      "created_at": "2026-05-03T12:00:00Z",
      "status": "processed"
    }
  ]
}
```

### 3.3. Get Assessment Detail

Mengambil detail data asesmen spesifik yang pernah diisi oleh siswa secara lengkap, termasuk nilai rata-rata (science_avg, social_avg, overall_score) yang telah dikalkulasi oleh sistem.

- **Endpoint:** `GET /assessments/{id}`
- **Access:** Private
- **Headers:** `Authorization: Bearer <access_token>`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Assessment detail retrieved successfully",
  "data": {
    "assessment_id": "assess-uuid-v4",
    "user_id": "uuid-v4-string",
    "math_score": 85.0,
    "physics_score": 80.0,
    "chemistry_score": 78.0,
    "biology_score": 72.0,
    "history_score": 68.0,
    "english_score": 75.0,
    "geography_score": 70.0,
    "weekly_self_study_hours": 20,
    "absence_days": 3,
    "science_avg": 76.67,
    "social_avg": 69.0,
    "overall_score": 75.43,
    "part_time_job": false,
    "extracurricular": true,
    "created_at": "2026-05-13T12:00:00Z"
  }
}
```

**Error Response (404 Not Found - Assessment Missing):**

```json
{
  "success": false,
  "message": "Assessment detail not found",
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "details": "No assessment record matches the provided ID for this user."
  }
}
```

## 4. Recommendation & AI Integration Module

Modul ini menangani komunikasi dengan peladen AI untuk menghasilkan prediksi kecocokan karier berdasarkan profil akademik dan perilaku belajar siswa.

### 4.1. Generate Prediction

Memicu proses inferensi ke peladen model AI.

- **Endpoint:** `POST /recommendations/predict`
- **Access:** Private
- **Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "assessment_id": "assess-uuid-v4"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Prediction generated successfully",
  "data": {
    "recommendation_id": "rec-uuid-v4",
    "assessment_id": "assess-uuid-v4",
    "status": "completed",
    "created_at": "2026-05-03T12:05:00Z"
  }
}
```

**Error Response (404 Not Found - Assessment Missing):**

```json
{
  "success": false,
  "message": "Assessment not found",
  "data": null,
  "error": {
    "code": "ASSESSMENT_NOT_FOUND",
    "details": "No assessment data found for the provided ID."
  }
}
```

**Success Response (200 OK - Already Predicted):**

```json
{
  "success": true,
  "message": "Prediction already exists for this assessment",
  "data": {
    "recommendation_id": "rec-uuid-v4"
  }
}
```

**Error Response (502 Bad Gateway - AI Server Unreachable):**

```json
{
  "success": false,
  "message": "AI Engine unavailable",
  "data": null,
  "error": {
    "code": "AI_ENGINE_DOWN",
    "details": "Failed to communicate with the prediction engine. Please try again later."
  }
}
```

### 4.2. Get Recommendation Details

Mengambil hasil analisis penuh dari asesmen pengguna. Mengembalikan profil kognitif dinamis (untuk visualisasi grafik) serta 3 rekomendasi jalur karir beserta jurusan kuliah yang relevan.

- **Endpoint:** `GET /recommendations/{id}`
- **Access:** Private
- **Headers:** `Authorization: Bearer <access_token>`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Recommendation detail retrieved successfully",
  "data": {
    "recommendation_id": "rec-uuid-v4",
    "assessment_id": "assess-uuid-v4",
    "ai_summary": "Berdasarkan analisis AI, kamu memiliki potensi besar di bidang Sains & Kedokteran, diikuti oleh Profesional & Keuangan dan Teknologi & Komputasi.",
    "ai_explanation": {
      "alasan": "Profil kamu sangat cocok dengan Sains & Kedokteran karena nilai Matematika yang tinggi (92)...",
      "kekuatan": "Kekuatan akademik utama kamu terletak pada kemampuan bahasa Inggris yang sangat baik (95)...",
      "saran": "Untuk mempersiapkan diri, kamu perlu meningkatkan nilai Fisika...",
      "referensi": [
        {
          "title": "FK Universitas Indonesia",
          "url": "[https://fk.ui.ac.id](https://fk.ui.ac.id)",
          "keterangan": "Informasi tentang program studi"
        }
      ]
    },
    "created_at": "2026-05-18T04:00:49.979Z",
    "career_matches": [
      {
        "career_id": "CAR-001",
        "career_name": "Data Scientist",
        "category": "Sains & Kedokteran",
        "description": "Menganalisis data mentah menjadi wawasan strategis.",
        "match_rank": 1,
        "confidence_score": 99.91,
        "related_majors": [
          {
            "major_id": "MAJ-001",
            "major_name": "Sains Data",
            "faculty": "Fakultas Teknologi Informasi"
          }
        ]
      }
    ]
  }
}
```

**Error Response (404 Not Found - Recommendation Missing):**

```json
{
  "success": false,
  "message": "Recommendation not found",
  "data": null,
  "error": {
    "code": "RECOMMENDATION_NOT_FOUND",
    "details": "No recommendation data found for the provided ID."
  }
}
```

## 5. Master Data Module

Modul ini menyediakan referensi data statis yang digunakan untuk mendukung elemen antarmuka pengguna.

### 5.1. Get Career Catalog

Mengambil daftar lengkap jalur karier dan jurusan yang didukung oleh sistem.

- **Endpoint:** `GET /careers`
- **Access:** Public

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Career catalog retrieved successfully",
  "data": [
    {
      "career_id": "CAR-001",
      "career_name": "Data Scientist",
      "category": "Technology & Data"
    },
    {
      "career_id": "CAR-002",
      "career_name": "Software Engineer",
      "category": "Software Engineering"
    },
    {
      "career_id": "CAR-003",
      "career_name": "Dokter Umum",
      "category": "Kesehatan & Medis"
    }
  ]
}
```
