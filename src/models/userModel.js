import { query } from "../config/database.js";

/**
 * Mencari data pengguna berdasarkan alamat email.
 * Fungsi ini digunakan saat login dan validasi registrasi (mencegah email ganda).
 *
 * @param {string} email - Email pengguna yang dicari
 * @returns {object|undefined} - Mengembalikan objek pengguna jika ada, atau undefined jika tidak ditemukan
 */
export const findUserByEmail = async (email) => {
  const sql = `
    SELECT user_id, email, password_hash, full_name, school_name, is_assessment_completed 
    FROM users 
    WHERE email = $1
  `;

  const result = await query(sql, [email]);

  return result.rows[0];
};

/**
 * Memasukkan data pengguna baru ke dalam database.
 *
 * @param {object} userData - Objek yang berisi data registrasi pengguna
 * @returns {object} - Mengembalikan data pengguna yang baru dibuat (tanpa password)
 */
export const createUser = async (userData) => {
  const { email, passwordHash, fullName, schoolName } = userData;

  const sql = `
    INSERT INTO users (email, password_hash, full_name, school_name)
    VALUES ($1, $2, $3, $4)
    RETURNING user_id, email, full_name, school_name, is_assessment_completed, created_at
  `;

  const result = await query(sql, [email, passwordHash, fullName, schoolName]);

  return result.rows[0];
};

/**
 * Mengambil data profil pengguna berdasarkan user_id.
 * Fungsi ini digunakan untuk endpoint GET /profiles/me.
 *
 * @param {string} userId - UUID pengguna dari token JWT
 * @returns {object|undefined} - Mengembalikan data profil jika ada, atau undefined jika tidak ditemukan
 */
export const getUserById = async (userId) => {
  const sql = `
    SELECT user_id, email, full_name, school_name, is_assessment_completed 
    FROM users 
    WHERE user_id = $1
  `;

  const result = await query(sql, [userId]);

  return result.rows[0];
};

/**
 * Memperbarui data profil pengguna spesifik (nama lengkap dan sekolah).
 * Fungsi ini digunakan untuk endpoint PUT /profiles/me.
 *
 * @param {string} userId - UUID pengguna yang datanya akan diubah
 * @param {object} updateData - Objek yang berisi data pembaruan (format camelCase)
 * @returns {object} - Mengembalikan data pengguna yang telah diperbarui
 */
export const updateUserProfile = async (userId, updateData) => {
  const { fullName, schoolName } = updateData;

  const sql = `
    UPDATE users 
    SET full_name = $1, school_name = $2
    WHERE user_id = $3
    RETURNING user_id, email, full_name, school_name, is_assessment_completed
  `;

  const result = await query(sql, [fullName, schoolName, userId]);

  return result.rows[0];
};
