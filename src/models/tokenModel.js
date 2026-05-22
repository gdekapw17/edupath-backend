import { query } from "../config/database.js";

/**
 * Menyimpan refresh token baru ke database.
 */
export const saveRefreshToken = async (tokenId, userId, token, expiresAt) => {
  const sql = `
    INSERT INTO refresh_tokens (token_id, user_id, token, expires_at) 
    VALUES ($1, $2, $3, $4)
  `;
  await query(sql, [tokenId, userId, token, expiresAt]);
};

/**
 * Mencari refresh token di database berdasarkan string token-nya.
 */
export const findRefreshToken = async (token) => {
  const sql = `SELECT * FROM refresh_tokens WHERE token = $1`;
  const result = await query(sql, [token]);
  return result.rows[0];
};

/**
 * Menghapus refresh token dari database (digunakan saat logout atau token expired).
 */
export const deleteRefreshToken = async (token) => {
  const sql = `DELETE FROM refresh_tokens WHERE token = $1`;
  await query(sql, [token]);
};
