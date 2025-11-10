/**
 * Represents a user in the authentication system
 */
export interface User {
  username: string;
  authenticatedAt: number;
}

/**
 * Result returned from authentication attempts
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Authentication service interface
 */
export interface AuthService {
  authenticate(username: string, password: string): Promise<AuthResult>;
  validateSession(user: User): boolean;
}

/**
 * Authentication context type for React Context
 */
export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}
