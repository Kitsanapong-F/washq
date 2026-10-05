const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken, requireAdmin, optionalToken } = require('../../middlewares/authMiddleware');

const SECRET = 'washq_test_secret_key';
process.env.JWT_SECRET = SECRET;

describe('Unit Tests: Authentication & Authorization Modules', () => {
  describe('Password Hashing & Verification (bcryptjs)', () => {
    it('UT-AUTH-01: should correctly hash a plain text password', async () => {
      const password = 'StudentPassword123';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
    });

    it('UT-AUTH-02: should verify correct password against hashed password', async () => {
      const password = '123456';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const isMatch = await bcrypt.compare(password, hash);
      expect(isMatch).toBe(true);
    });

    it('UT-AUTH-03: should reject incorrect password against hashed password', async () => {
      const password = '123456';
      const wrongPassword = 'WrongPassword999';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const isMatch = await bcrypt.compare(wrongPassword, hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('JWT Token Generation & Verification', () => {
    it('UT-AUTH-04: should generate a valid JWT token with payload', () => {
      const payload = {
        userId: 1,
        studentCode: '6512345678-9',
        role: 'student'
      };

      const token = jwt.sign(payload, SECRET, { expiresIn: '1d' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, SECRET);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.studentCode).toBe(payload.studentCode);
      expect(decoded.role).toBe(payload.role);
    });

    it('UT-AUTH-05: should reject token signed with invalid secret', () => {
      const payload = { userId: 2, role: 'student' };
      const token = jwt.sign(payload, 'wrong_secret');

      expect(() => {
        jwt.verify(token, SECRET);
      }).toThrow();
    });
  });

  describe('Auth Middleware (verifyToken & requireAdmin)', () => {
    it('UT-AUTH-06: verifyToken should accept valid Bearer token', () => {
      const payload = { userId: 10, role: 'student' };
      const token = jwt.sign(payload, SECRET);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      verifyToken(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(10);
    });

    it('UT-AUTH-07: verifyToken should reject missing token with 401', () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      verifyToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Token Missing')
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('UT-AUTH-08: requireAdmin should allow admin role to proceed', () => {
      const req = { user: { userId: 99, role: 'admin' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      requireAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('UT-AUTH-09: requireAdmin should forbid non-admin student role with 403', () => {
      const req = { user: { userId: 1, role: 'student' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      requireAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
