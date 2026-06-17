import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type UserRole = 'citizen' | 'collector' | 'administrator' | 'supervisor';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  district?: string;
  photoUrl?: string;
  bankAccountNumber?: string;
  department?: string;
  is_blocked?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string, phone: string, district: string) => Promise<void>;
  logout: () => void;
  updateUser?: (data: Partial<User>) => Promise<void>;
  changePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as User;
        if (parsed?.id != null && typeof parsed.id === 'string') {
          parsed.id = Number(parsed.id);
        }
        setUser(parsed);
      }
    } catch (err) {
      console.error('Failed to restore user from localStorage:', err);
      localStorage.removeItem('user');
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      
      // Call backend API to authenticate user
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle both UNAUTHORIZED (401) and FORBIDDEN (403 for blocked)
        if (response.status === 403) {
          throw new Error(errorData.message || 'Your account has been blocked.');
        }
        throw new Error(errorData.message || 'Invalid email or password');
      }

      const userData = await response.json();
      
      // Additional frontend check for blocked status (defense in depth)
      if (userData.isBlocked || userData.is_blocked) {
        throw new Error('Your account has been blocked. Please contact support.');
      }
      
      // Map backend response to User interface
      // Backend returns roles in uppercase (ADMIN, SUPERVISOR, etc.)
      let role: UserRole = 'citizen'; // default
      const backendRole = userData.role?.toUpperCase() || 'CITIZEN';
      if (backendRole === 'ADMIN') {
        role = 'administrator';
      } else if (backendRole === 'SUPERVISOR') {
        role = 'supervisor';
      } else if (backendRole === 'COLLECTOR') {
        role = 'collector';
      } else {
        role = 'citizen';
      }

      const user: User = {
        id: Number(userData.id) || 0,
        name: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : userData.username || '',
        email: userData.email,
        role: role,
        phone: userData.phoneNumber,
        district: userData.district,
        photoUrl: userData.photoUrl,
        bankAccountNumber: userData.bankAccountNumber,
        department: userData.department,
        is_blocked: userData.isBlocked || userData.is_blocked || false,
      };

      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      throw err;
    }
  };

  const signup = async (firstName: string, lastName: string, email: string, password: string, phone: string, district: string) => {
    try {
      setError(null);
      
      // Call backend API to create new user
      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ firstName, lastName, email, password, phoneNumber: phone, district }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signup failed');
      }

      // After successful signup, automatically log the user in
      await login(email, password);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMsg);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      setError(null);
      
      // Map frontend User to backend payload
      const payload = {
        firstName: data.name?.split(' ')[0] || user.name.split(' ')[0],
        lastName: data.name?.split(' ').slice(1).join(' ') || user.name.split(' ').slice(1).join(' '),
        phoneNumber: data.phone || user.phone,
        district: data.district || user.district,
        photoUrl: data.photoUrl || user.photoUrl,
        bankAccountNumber: data.bankAccountNumber ?? user.bankAccountNumber,
      };
      
      const response = await fetch(`http://localhost:8080/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedUserData = await response.json();
      
      // Update local user state
      const updated = {
        ...user,
        ...data,
        bankAccountNumber:
          updatedUserData.bankAccountNumber ?? data.bankAccountNumber ?? user.bankAccountNumber,
      };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Profile update failed';
      setError(errorMsg);
      throw err;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      setError(null);
      
      const response = await fetch(`http://localhost:8080/api/users/${user.id}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to change password');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Password change failed';
      setError(errorMsg);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, changePassword, isAuthenticated: !!user, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
