import { authService } from './authService';
import { User } from './types';

describe('AuthService', () => {
  describe('authenticate', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const username = 'testuser';
      const password = 'testpass123';

      const result = await authService.authenticate(username, password);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe(username);
      expect(result.user?.authenticatedAt).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should reject empty username', async () => {
      const result = await authService.authenticate('', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Username is required');
      expect(result.user).toBeUndefined();
    });

    it('should reject whitespace-only username', async () => {
      const result = await authService.authenticate('   ', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Username is required');
      expect(result.user).toBeUndefined();
    });

    it('should reject empty password', async () => {
      const result = await authService.authenticate('testuser', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password is required');
      expect(result.user).toBeUndefined();
    });

    it('should reject whitespace-only password', async () => {
      const result = await authService.authenticate('testuser', '   ');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password is required');
      expect(result.user).toBeUndefined();
    });

    it('should simulate authentication delay of approximately 800ms', async () => {
      const startTime = Date.now();
      await authService.authenticate('testuser', 'password123');
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Allow for some variance (750ms to 850ms)
      expect(duration).toBeGreaterThanOrEqual(750);
      expect(duration).toBeLessThan(900);
    });

    it('should trim username whitespace', async () => {
      const result = await authService.authenticate('  testuser  ', 'password123');

      expect(result.success).toBe(true);
      expect(result.user?.username).toBe('testuser');
    });
  });

  describe('validateSession', () => {
    it('should validate a fresh session as valid', () => {
      const user: User = {
        username: 'testuser',
        authenticatedAt: Date.now()
      };

      const isValid = authService.validateSession(user);

      expect(isValid).toBe(true);
    });

    it('should validate a session within 24 hours as valid', () => {
      const oneHourAgo = Date.now() - (1 * 60 * 60 * 1000);
      const user: User = {
        username: 'testuser',
        authenticatedAt: oneHourAgo
      };

      const isValid = authService.validateSession(user);

      expect(isValid).toBe(true);
    });

    it('should invalidate an expired session (older than 24 hours)', () => {
      const twentyFiveHoursAgo = Date.now() - (25 * 60 * 60 * 1000);
      const user: User = {
        username: 'testuser',
        authenticatedAt: twentyFiveHoursAgo
      };

      const isValid = authService.validateSession(user);

      expect(isValid).toBe(false);
    });

    it('should invalidate session with missing authenticatedAt', () => {
      const user = {
        username: 'testuser',
        authenticatedAt: undefined as any
      };

      const isValid = authService.validateSession(user);

      expect(isValid).toBe(false);
    });

    it('should invalidate null user', () => {
      const isValid = authService.validateSession(null as any);

      expect(isValid).toBe(false);
    });
  });
});
