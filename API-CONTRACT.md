# EduPath API Contract

**Base URL:** `https://api.edupath.com/api/v1` (Production) / `http://localhost:3000/api/v1` (Development)
**Content-Type:** `application/json`

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
