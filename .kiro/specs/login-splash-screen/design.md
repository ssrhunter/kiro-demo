# Design Document

## Overview

The login splash screen will be implemented as a client-side authentication layer that wraps the Next.js application. The design uses React Context for state management, browser localStorage for session persistence, and a component-based architecture that integrates seamlessly with the existing Next.js App Router structure.

The authentication system will be built with extensibility in mind, using a simple mock implementation initially that can be easily replaced with real authentication services (OAuth, JWT, etc.) in the future.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│         Browser (Client)                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   AuthProvider (Context)          │ │
│  │   - Session State                 │ │
│  │   - Login/Logout Methods          │ │
│  └───────────────────────────────────┘ │
│              │                          │
│              ├─────────────┬───────────┤
│              │             │           │
│  ┌───────────▼──────┐  ┌──▼─────────┐ │
│  │ LoginSplashScreen│  │ Protected  │ │
│  │   Component      │  │  Content   │ │
│  └──────────────────┘  └────────────┘ │
│              │                          │
│  ┌───────────▼──────────────────────┐  │
│  │   localStorage (Session)         │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Component Hierarchy

```
RootLayout (app/layout.tsx)
└── AuthProvider
    ├── LoginSplashScreen (conditional)
    └── children (protected content)
```

## Components and Interfaces

### 1. Authentication Context

**File**: `lib/auth/AuthContext.tsx`

**Purpose**: Provides authentication state and methods throughout the application using React Context.

**Interface**:
```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

interface User {
  username: string;
  authenticatedAt: number;
}
```

**Key Responsibilities**:
- Manage authentication state (isAuthenticated, user, loading, error)
- Provide login/logout methods to child components
- Handle session persistence via localStorage
- Restore session on initial load
- Simulate authentication delay for realistic UX

### 2. Authentication Service

**File**: `lib/auth/authService.ts`

**Purpose**: Encapsulates authentication logic, providing a clear interface for future integration with real auth services.

**Interface**:
```typescript
interface AuthService {
  authenticate(username: string, password: string): Promise<AuthResult>;
  validateSession(user: User): boolean;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}
```

**Key Responsibilities**:
- Mock authentication logic (accept any non-empty credentials)
- Simulate network delay (500-1000ms)
- Validate input (non-empty username and password)
- Session validation (check expiry)
- Return structured results with success/error states

**Mock Implementation Details**:
- Accept any username/password combination where both fields are non-empty
- Simulate 800ms delay to mimic API call
- Return user object with username and timestamp
- Provide clear extension points for real API integration

### 3. Login Splash Screen Component

**File**: `components/LoginSplashScreen.tsx`

**Purpose**: Full-screen UI component for user authentication.

**Props**: None (uses AuthContext)

**Key Responsibilities**:
- Render full-screen overlay with centered login form
- Provide username and password input fields
- Handle form submission and validation
- Display loading state during authentication
- Show error messages for failed attempts
- Clear errors on input change
- Prevent form submission with empty fields

**UI Structure**:
```
┌─────────────────────────────────────┐
│     Full Screen Overlay (blur bg)  │
│                                     │
│    ┌─────────────────────────┐     │
│    │   Login Card            │     │
│    │                         │     │
│    │   [App Logo/Title]      │     │
│    │                         │     │
│    │   Username: [_______]   │     │
│    │   Password: [_______]   │     │
│    │                         │     │
│    │   [Error Message]       │     │
│    │                         │     │
│    │   [Login Button]        │     │
│    │                         │     │
│    └─────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

### 4. Auth Provider Component

**File**: `components/AuthProvider.tsx`

**Purpose**: Wrapper component that provides authentication context and conditionally renders login screen.

**Props**:
```typescript
interface AuthProviderProps {
  children: React.ReactNode;
}
```

**Key Responsibilities**:
- Initialize authentication context
- Restore session from localStorage on mount
- Conditionally render LoginSplashScreen or children based on auth state
- Show loading state during session restoration

## Data Models

### User Model

```typescript
interface User {
  username: string;
  authenticatedAt: number;
}
```

**Storage**: localStorage key `auth_session`

**Persistence Format**:
```json
{
  "username": "user@example.com",
  "authenticatedAt": 1699564800000
}
```

### Session Validation

- Sessions are valid for 24 hours from `authenticatedAt` timestamp
- On page load, check if stored session exists and is not expired
- If expired, clear localStorage and show login screen

## Error Handling

### Error Types

1. **Validation Errors**
   - Empty username: "Username is required"
   - Empty password: "Password is required"
   - Display inline below respective input field

2. **Authentication Errors**
   - Invalid credentials: "Invalid username or password" (mock will not trigger this)
   - Network errors: "Unable to connect. Please try again."
   - Display in error banner above submit button

3. **Session Errors**
   - Expired session: Silently redirect to login screen
   - Corrupted localStorage: Clear and show login screen

### Error Display Strategy

- Use red text for error messages
- Clear errors when user starts typing
- Show errors inline for field-specific issues
- Show errors in banner for general authentication failures
- Disable submit button during authentication to prevent duplicate requests

## Testing Strategy

### Unit Tests

1. **AuthService Tests**
   - Test successful authentication with valid credentials
   - Test rejection of empty username
   - Test rejection of empty password
   - Test authentication delay timing
   - Test session validation logic

2. **AuthContext Tests**
   - Test initial state (unauthenticated)
   - Test login flow updates state correctly
   - Test logout clears state and localStorage
   - Test session restoration from localStorage
   - Test expired session handling

### Integration Tests

1. **Login Flow Tests**
   - Test complete login flow from form submission to authenticated state
   - Test error display on validation failure
   - Test loading state during authentication
   - Test redirect to protected content after successful login

2. **Session Persistence Tests**
   - Test session saves to localStorage on login
   - Test session restores on page refresh
   - Test expired session clears on page load

### Component Tests

1. **LoginSplashScreen Tests**
   - Test form renders with username and password fields
   - Test submit button disabled state
   - Test error message display
   - Test form submission calls login method
   - Test error clearing on input change

## Implementation Notes

### Styling Approach

- Use Tailwind CSS for styling (add as dependency)
- Full-screen overlay with backdrop blur
- Centered card with shadow and rounded corners
- Responsive design (mobile-friendly)
- Focus states for accessibility

### Accessibility Considerations

- Proper label associations for form inputs
- ARIA attributes for error messages
- Keyboard navigation support
- Focus management (auto-focus username field)
- Screen reader announcements for errors

### Performance Considerations

- Lazy load authentication components (not critical for initial render)
- Minimize re-renders using React.memo where appropriate
- Debounce error clearing to avoid excessive updates
- Use CSS transforms for smooth animations

### Security Considerations (Future)

- Current mock implementation is not secure (by design)
- When integrating real auth:
  - Use HTTPS only
  - Implement CSRF protection
  - Use secure, httpOnly cookies for tokens
  - Implement rate limiting
  - Hash passwords on server
  - Use OAuth 2.0 or similar standard

### Extension Points for Real Authentication

The design includes clear interfaces that can be swapped:

1. **authService.ts**: Replace mock with API calls
   ```typescript
   // Future implementation
   async authenticate(username: string, password: string) {
     const response = await fetch('/api/auth/login', {
       method: 'POST',
       body: JSON.stringify({ username, password })
     });
     return response.json();
   }
   ```

2. **Session Storage**: Replace localStorage with secure cookies or JWT
3. **User Model**: Extend with additional fields (email, roles, permissions)
4. **AuthContext**: Add methods for token refresh, password reset, etc.
