import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';

/**
 * Generates a signed short-lived JWT access token
 * @param {object} payload - Claims to embed in token (sub, tenantId, roles, email, etc.)
 * @returns {string} Signed JWT
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

/**
 * Verifies an access token
 * @param {string} token
 * @returns {object} Decoded JWT payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

/**
 * Generates an unhashed cryptographically strong random token string (used for refresh tokens & reset tokens)
 * @param {number} bytesLength
 * @returns {string} Hex encoded random string
 */
export const generateRandomTokenString = (bytesLength = 40) => {
  return crypto.randomBytes(bytesLength).toString('hex');
};

/**
 * Computes SHA-256 hash of a string (so refresh tokens are never stored plain in database)
 * @param {string} tokenString
 * @returns {string} Hex encoded hash
 */
export const hashToken = (tokenString) => {
  return crypto.createHash('sha256').update(tokenString).digest('hex');
};
