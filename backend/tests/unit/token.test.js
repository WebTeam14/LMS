import {
  generateAccessToken,
  verifyAccessToken,
  generateRandomTokenString,
  hashToken,
} from '../../src/common/utils/token.js';

describe('Token Utilities (Unit Tests)', () => {
  it('generates and verifies a valid access token', () => {
    const payload = {
      sub: '507f1f77bcf86cd799439011',
      tenantId: '507f1f77bcf86cd799439012',
      email: 'student@university.edu',
      roles: ['STUDENT'],
      permissions: ['courses:read'],
    };

    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.tenantId).toBe(payload.tenantId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.roles).toEqual(['STUDENT']);
    expect(decoded.permissions).toEqual(['courses:read']);
  });

  it('throws error when verifying tampered token', () => {
    const payload = { sub: '507f1f77bcf86cd799439011' };
    const token = generateAccessToken(payload);
    const tampered = token.slice(0, -5) + 'abcde';

    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('generates random crypto hex token strings', () => {
    const token1 = generateRandomTokenString(32);
    const token2 = generateRandomTokenString(32);

    expect(token1).toHaveLength(64); // 32 bytes = 64 hex characters
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('computes consistent SHA-256 token hashes', () => {
    const tokenStr = 'test-token-value-12345';
    const hash1 = hashToken(tokenStr);
    const hash2 = hashToken(tokenStr);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hashToken('different-value')).not.toBe(hash1);
  });
});
