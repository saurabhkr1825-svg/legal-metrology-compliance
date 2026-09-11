import { hashPassword, verifyPassword } from '../src/services/user.service';
import { verifyToken } from '../src/services/auth.service';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';

describe('Authentication & Password Security', () => {
  describe('Password Hashing', () => {
    it('should hash passwords with bcrypt', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$') || hash.startsWith('$2a$')).toBe(true);
    });

    it('should verify correct password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Verification', () => {
    it('should verify valid token', () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'officer@example.com',
        role: 'FIELD_OFFICER',
      };

      const token = jwt.sign(payload, config.jwt.secret, { expiresIn: 3600 });
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.role).toBe(payload.role);
    });

    it('should reject expired token', () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'officer@example.com',
        role: 'FIELD_OFFICER',
      };

      const expiredToken = jwt.sign(payload, config.jwt.secret, { expiresIn: -10 });
      const decoded = verifyToken(expiredToken);

      expect(decoded).toBeNull();
    });

    it('should reject token with invalid signature', () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'officer@example.com',
        role: 'FIELD_OFFICER',
      };

      const invalidToken = jwt.sign(payload, 'wrong-secret');
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });
  });
});
