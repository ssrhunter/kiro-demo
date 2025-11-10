import { AuthService, AuthResult, User } from './types';

/**
 * Mock authentication service implementation
 * Accepts any non-empty credentials for development purposes
 */
class MockAuthService implements AuthService {
  /**
   * Authenticates a user with the provided credentials
   * Mock implementation accepts any non-empty username and password
   * 
   * @param username - The username to authenticate
   * @param password - The password to authenticate
   * @returns Promise resolving to AuthResult with success status and user data
   */
  async authenticate(username: string, password: string): Promise<AuthResult> {
    // Simulate network delay (800ms)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Validate that credentials are not empty
    if (!username || username.trim() === '') {
      return {
        success: false,
        error: 'Username is required'
      };
    }

    if (!password || password.trim() === '') {
      return {
        success: false,
        error: 'Password is required'
      };
    }

    // Mock implementation: accept any non-empty credentials
    const user: User = {
      username: username.trim(),
      authenticatedAt: Date.now()
    };

    return {
      success: true,
      user
    };
  }

  /**
   * Validates if a user session is still valid
   * Sessions are valid for 24 hours from authentication time
   * 
   * @param user - The user object to validate
   * @returns true if session is valid, false if expired
   */
  validateSession(user: User): boolean {
    if (!user || !user.authenticatedAt) {
      return false;
    }

    const now = Date.now();
    const sessionDuration = now - user.authenticatedAt;
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    return sessionDuration < twentyFourHours;
  }
}

// Export singleton instance
export const authService: AuthService = new MockAuthService();

// Export the interface for type checking
export type { AuthService } from './types';
