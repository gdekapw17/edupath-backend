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
  "message": "Validation failed",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": "Deskripsi spesifik mengenai field mana yang salah."
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
    "expires_in": 3600,
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
  "academic_scores": {
    "science": {
      "math": 80,
      "physics": 80,
      "chemistry": 75,
      "biology": 70
    },
    "social": {
      "history": 70,
      "geography": 65,
      "english": 75
    }
  },
  "behavioral_metrics": {
    "weekly_study_hours": 10,
    "absence_days": 2,
    "extracurricular": "Tidak Ada"
  }
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

**Error Response (422 Unprocessable Entity - Out of Range Data):**

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "error": {
    "code": "OUT_OF_RANGE",
    "details": "Academic scores must be between 0 and 100. Invalid value found in 'math'."
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

**Error Response (409 Conflict - Already Predicted):**

```json
{
  "success": false,
  "message": "Prediction already exists",
  "data": null,
  "error": {
    "code": "PREDICTION_ALREADY_EXISTS",
    "details": "A prediction has already been generated for this assessment ID."
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
  "message": "Recommendation retrieved successfully",
  "data": {
    "user_details": {
      "full_name": "Alex Pratama",
      "school_name": "SMA Negeri 8 Jakarta"
    },
    "recommendation_info": {
      "recommendation_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2026-05-03T20:30:00Z"
    },
    "ai_summary": "Alex memiliki kemampuan berpikir komputasional dan determinasi yang sangat menonjol. Ia memiliki ketertarikan alami dalam memecahkan masalah kompleks berbasis data",
    "cognitive_profile": [
      { "subject": "Logika & Analitik", "value": 88 },
      { "subject": "Literasi Sains", "value": 82 },
      { "subject": "Wawasan Sosial", "value": 75 },
      { "subject": "Komunikasi Verbal", "value": 80 },
      { "subject": "Manajemen Diri", "value": 90 },
      { "subject": "Interpersonal", "value": 85 }
    ],
    "career_matches": [
      {
        "rank": 1,
        "confidence_score": 0.89,
        "career_details": {
          "career_id": "SWE-01",
          "career_name": "Data Scientist",
          "category": "Data & Artificial Intelligence",
          "description": "Seorang ahli yang mengubah data mentah menjadi wawasan strategis."
        },
        "recommended_majors": [
          {
            "major_id": "MAJ-01",
            "major_name": "Sains Data",
            "faculty": "Fakultas Teknologi Informasi"
          },
          {
            "major_id": "MAJ-02",
            "major_name": "Statistika",
            "faculty": "Fakultas Matematika dan IPA"
          }
        ]
      },
      {
        "rank": 2,
        "confidence_score": 0.78,
        "career_details": {
          "career_id": "SWE-02",
          "career_name": "Backend Engineer",
          "category": "Software Engineering",
          "description": "Fokus pada arsitektur peladen, pengelolaan basis data, dan performa API."
        },
        "recommended_majors": [
          {
            "major_id": "MAJ-03",
            "major_name": "Teknik Informatika",
            "faculty": "Fakultas Teknik"
          }
        ]
      },
      {
        "rank": 3,
        "confidence_score": 0.72,
        "career_details": {
          "career_id": "DES-01",
          "career_name": "UI/UX Researcher",
          "category": "Design",
          "description": "Menganalisis kebutuhan pengguna untuk merancang antarmuka yang intuitif."
        },
        "recommended_majors": [
          {
            "major_id": "MAJ-04",
            "major_name": "Sistem Informasi",
            "faculty": "Fakultas Ilmu Komputer"
          },
          {
            "major_id": "MAJ-05",
            "major_name": "Psikologi",
            "faculty": "Fakultas Psikologi"
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
      "career_id": "car-001",
      "career_name": "Software Engineer",
      "category": "Technology"
    },
    {
      "career_id": "car-002",
      "career_name": "Data Scientist",
      "category": "Data"
    }
  ]
}
```
