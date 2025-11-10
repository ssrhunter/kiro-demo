import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { LoginSplashScreen } from '@/components/LoginSplashScreen';
import AuthProviderWrapper from '@/components/AuthProvider';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Login Flow Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Complete login flow from form submission to authenticated state', () => {
    it('should successfully authenticate user and update state', async () => {
      const user = userEvent.setup();
      const TestComponent = () => (
        <AuthProvider>
          <LoginSplashScreen />
        </AuthProvider>
      );

      render(<TestComponent />);

      // Verify login form is displayed
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

      // Fill in credentials
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpass123');

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for authentication to complete
      await waitFor(() => {
        const session = localStorageMock.getItem('auth_session');
        expect(session).toBeTruthy();
        const parsedSession = JSON.parse(session!);
        expect(parsedSession.username).toBe('testuser');
        expect(parsedSession.authenticatedAt).toBeDefined();
      });
    });

    it('should display loading state during authentication', async () => {
      const user = userEvent.setup();
      const TestComponent = () => (
        <AuthProvider>
          <LoginSplashScreen />
        </AuthProvider>
      );

      render(<TestComponent />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpass123');

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Check for loading state
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });

    it('should display validation errors for empty fields', async () => {
      const user = userEvent.setup();
      const TestComponent = () => (
        <AuthProvider>
          <LoginSplashScreen />
        </AuthProvider>
      );

      render(<TestComponent />);

      // Submit form without filling fields
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when user types', async () => {
      const user = userEvent.setup();
      const TestComponent = () => (
        <AuthProvider>
          <LoginSplashScreen />
        </AuthProvider>
      );

      render(<TestComponent />);

      // Submit form without filling fields
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });

      // Type in username field
      await user.type(screen.getByLabelText(/username/i), 'test');

      // Username error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Session persistence across page refresh', () => {
    it('should restore valid session from localStorage on mount', async () => {
      // Set up a valid session in localStorage
      const validSession = {
        username: 'testuser',
        authenticatedAt: Date.now(),
      };
      localStorageMock.setItem('auth_session', JSON.stringify(validSession));

      const ProtectedContent = () => <div>Protected Content</div>;
      const TestComponent = () => (
        <AuthProviderWrapper>
          <ProtectedContent />
        </AuthProviderWrapper>
      );

      render(<TestComponent />);

      // Wait for session restoration
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should persist session after successful login', async () => {
      const user = userEvent.setup();
      const TestComponent = () => (
        <AuthProvider>
          <LoginSplashScreen />
        </AuthProvider>
      );

      render(<TestComponent />);

      // Login
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpass123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify session is stored
      await waitFor(() => {
        const session = localStorageMock.getItem('auth_session');
        expect(session).toBeTruthy();
        const parsedSession = JSON.parse(session!);
        expect(parsedSession.username).toBe('testuser');
      });
    });
  });

  describe('Logout functionality clears session', () => {
    it('should clear localStorage and reset state on logout', async () => {
      const user = userEvent.setup();
      
      // First, login to create an authenticated session
      const TestComponent = () => (
        <AuthProvider>
          <LoginSplashScreen />
        </AuthProvider>
      );

      const { rerender } = render(<TestComponent />);

      // Login
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpass123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for authentication to complete
      await waitFor(() => {
        const session = localStorageMock.getItem('auth_session');
        expect(session).toBeTruthy();
      });

      // Now test logout by creating a component that uses logout
      const LogoutTestComponent = () => {
        const { logout, isAuthenticated } = require('@/lib/auth/AuthContext').useAuth();
        
        React.useEffect(() => {
          // Simulate logout action
          const timer = setTimeout(() => logout(), 100);
          return () => clearTimeout(timer);
        }, [logout]);

        return isAuthenticated ? <div>Authenticated</div> : <LoginSplashScreen />;
      };

      rerender(
        <AuthProvider>
          <LogoutTestComponent />
        </AuthProvider>
      );

      // Verify session is cleared after logout
      await waitFor(() => {
        expect(localStorageMock.getItem('auth_session')).toBeNull();
      }, { timeout: 3000 });

      // Verify login screen is shown
      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });
    });
  });

  describe('Expired session handling on page load', () => {
    it('should clear expired session and show login screen', async () => {
      // Set up an expired session (25 hours ago)
      const expiredSession = {
        username: 'testuser',
        authenticatedAt: Date.now() - (25 * 60 * 60 * 1000),
      };
      localStorageMock.setItem('auth_session', JSON.stringify(expiredSession));

      const ProtectedContent = () => <div>Protected Content</div>;
      const TestComponent = () => (
        <AuthProviderWrapper>
          <ProtectedContent />
        </AuthProviderWrapper>
      );

      render(<TestComponent />);

      // Wait for session validation
      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      // Verify expired session was cleared
      expect(localStorageMock.getItem('auth_session')).toBeNull();

      // Verify login screen is displayed
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Set up corrupted session data
      localStorageMock.setItem('auth_session', 'invalid-json-data');

      const ProtectedContent = () => <div>Protected Content</div>;
      const TestComponent = () => (
        <AuthProviderWrapper>
          <ProtectedContent />
        </AuthProviderWrapper>
      );

      render(<TestComponent />);

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      // Verify corrupted session was cleared
      expect(localStorageMock.getItem('auth_session')).toBeNull();

      // Verify login screen is displayed
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });
});
