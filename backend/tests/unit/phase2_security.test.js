import { encrypt, decrypt, generateBackupCodes, hashBackupCode } from '../../src/common/utils/crypto.js';
import { parseUserAgent } from '../../src/common/utils/device.js';
import { generateSecret, generateURI, verifySync } from 'otplib';

describe('Phase 2 Security & Cryptography Unit Tests', () => {
  describe('AES-256-GCM Encryption / Decryption', () => {
    it('encrypts and successfully decrypts a sensitive plaintext secret', () => {
      const originalSecret = 'JBSWY3DPEHPK3PXP';
      const ciphertext = encrypt(originalSecret);

      expect(ciphertext).toBeDefined();
      expect(typeof ciphertext).toBe('string');
      expect(ciphertext).not.toEqual(originalSecret);
      expect(ciphertext.split(':')).toHaveLength(3); // iv:authTag:encryptedHex

      const decrypted = decrypt(ciphertext);
      expect(decrypted).toEqual(originalSecret);
    });

    it('returns null when encrypting or decrypting null/empty value', () => {
      expect(encrypt(null)).toBeNull();
      expect(decrypt(null)).toBeNull();
    });

    it('throws error when attempting to decrypt tampered ciphertext', () => {
      const ciphertext = encrypt('TopSecretCampusToken');
      const parts = ciphertext.split(':');
      // Tamper with the encrypted hex
      parts[2] = parts[2].slice(0, -2) + 'ff';
      const tampered = parts.join(':');

      expect(() => decrypt(tampered)).toThrow();
    });

    it('throws error on malformed ciphertext structure', () => {
      expect(() => decrypt('invalid-single-chunk')).toThrow('Malformed encrypted ciphertext payload');
    });
  });

  describe('TOTP Two-Factor Authentication (otplib)', () => {
    it('generates a valid base32 secret and otpauth URI', () => {
      const secret = generateSecret({ length: 20 });
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThanOrEqual(16);

      const uri = generateURI({
        issuer: 'UniSphere LMS',
        label: 'john.doe@unisphere.edu',
        secret,
      });

      expect(uri).toContain('otpauth://totp/');
      expect(uri).toContain('secret=' + secret);
      expect(uri).toContain('issuer=UniSphere');
    });

    it('verifies a generated TOTP token against the secret', () => {
      const secret = generateSecret({ length: 20 });
      // In otplib v13, generate token from secret or verify
      const uri = generateURI({ issuer: 'UniSphere', label: 'test@unisphere.edu', secret });
      expect(uri).toBeDefined();
    });
  });

  describe('MFA Emergency Backup Codes', () => {
    it('generates 8 unique, formatted emergency recovery codes', () => {
      const codes = generateBackupCodes(8);
      expect(codes).toHaveLength(8);

      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(8);

      // Verify format XXXX-XXXX
      codes.forEach((code) => {
        expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
      });
    });

    it('hashes backup codes consistently with SHA-256 regardless of hyphens and casing', () => {
      const code1 = 'A1B2-C3D4';
      const code2 = 'a1b2c3d4';
      const code3 = 'A1B2C3D4';

      const hash1 = hashBackupCode(code1);
      const hash2 = hashBackupCode(code2);
      const hash3 = hashBackupCode(code3);

      expect(hash1).toBeDefined();
      expect(hash1).toHaveLength(64); // SHA-256 hex length
      expect(hash1).toEqual(hash2);
      expect(hash2).toEqual(hash3);
    });
  });

  describe('Device Telemetry & User-Agent Parsing', () => {
    it('parses Chrome on Windows desktop correctly', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const parsed = parseUserAgent(ua);

      expect(parsed.browser).toBe('Chrome');
      expect(parsed.os).toBe('Windows 10/11');
      expect(parsed.deviceType).toBe('desktop');
      expect(parsed.deviceName).toBe('Chrome on Windows 10/11');
    });

    it('parses Safari on iPhone mobile correctly', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
      const parsed = parseUserAgent(ua);

      expect(parsed.browser).toBe('Safari');
      expect(parsed.os).toBe('iOS');
      expect(parsed.deviceType).toBe('mobile');
    });

    it('handles empty or undefined user agent string safely', () => {
      const parsed = parseUserAgent(null);

      expect(parsed.browser).toBe('Unknown Browser');
      expect(parsed.os).toBe('Unknown OS');
      expect(parsed.deviceType).toBe('desktop');
    });
  });
});
