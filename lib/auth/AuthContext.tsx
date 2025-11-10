'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User } from './types';
import { authService } from './authService';

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// localStorage key for session persistence
const SESSION_STORAGE_KEY = 'auth_session';

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Manages authentication state and provides auth methods to child components
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Session restoration logic on mount
  useEffect(() => {
    const restoreSession = () => {
      try {
        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        
        if (storedSession) {
          const parsedUser: User = JSON.parse(storedSession);
          
          // Validate the session
          if (authService.validateSession(parsedUser)) {
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            // Session expired, clear it
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch (err) {
        // Handle corrupted localStorage data
        console.error('Failed to restore session:', err);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  /**
   * Login method
   * Authenticates user with provided credentials and updates state
   */
  const login = async (username: string, password: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      const result = await authService.authenticate(username, password);

      if (result.success && result.user) {
        // Update state
        setUser(result.user);
        setIsAuthenticated(true);
        
        // Persist session to localStorage
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(result.user));
      } else {
        // Authentication failed
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Unable to connect. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout method
   * Clears authentication state and removes session from localStorage
   */
  const logout = (): void => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use the authentication context
 * Throws an error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
