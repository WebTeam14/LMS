import crypto from 'crypto';
import config from '../../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a 32-byte key from JWT access secret (or dedicated encryption secret)
 */
const getEncryptionKey = () => {
  const secret = process.env.MFA_ENCRYPTION_KEY || config.jwt.accessSecret;
  return crypto.createHash('sha256').update(String(secret)).digest();
};

/**
 * Encrypt plaintext string using AES-256-GCM
 * Returns: iv:authTag:encryptedData (hex encoded)
 */
export const encrypt = (plaintext) => {
  if (!plaintext) return null;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypt string using AES-256-GCM
 */
export const decrypt = (cipherText) => {
  if (!cipherText) return null;
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted ciphertext payload');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Generate 8 secure random backup codes (e.g., 'A1B2-C3D4')
 */
export const generateBackupCodes = (count = 8) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }
  return codes;
};

/**
 * Hash a backup code using SHA-256
 */
export const hashBackupCode = (code) => {
  const normalized = code.trim().replace(/-/g, '').toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

export default {
  encrypt,
  decrypt,
  generateBackupCodes,
  hashBackupCode,
};
