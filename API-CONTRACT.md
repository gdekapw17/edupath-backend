# EduPath API Contract

**Base URL:** `https://api.edupath.com/api/v1` (Production) / `http://localhost:3000/api/v1` (Development)
**Content-Type:** `application/json`

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

**Error Response (400 Bad Request - Email already exist):**

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

Mengambil detail profil dari siswa yang sedang terautentikasi.

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
    "math": 85,
    "physics": 78,
    "chemistry": 80,
    "biology": 75,
    "english": 90,
    "history": 82,
    "geography": 88
  },
  "behavioral_metrics": {
    "weekly_self_study_hours": 15,
    "absence_days": 2,
    "part_time_job": false
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
