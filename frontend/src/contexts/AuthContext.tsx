import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE } from "../config";

interface UserShape {
  email: string;
  display_name?: string;
  first_name?: string | null;
  last_name?: string | null;
  job_title?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserShape | null;
  login: (token: string, email: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserShape | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        // שומרים את כל המידע הרלוונטי שמגיע מהשרת, כולל display_name
        const normalized: UserShape = {
          email: userData.email,
          display_name: userData.display_name,
          first_name: userData.first_name,
          last_name: userData.last_name,
          job_title: userData.job_title,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
        };
        setUser(normalized);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (token: string, email: string) => {
    // שומרים את הטוקן ואז טוענים את פרטי המשתמש המלאים מ-/auth/me
    localStorage.setItem('token', token);
    setLoading(true);
    // אופציונלי: מציבים מיד מייל כדי שלא יהיה "ריק" לרגע
    setUser(prev => ({ ...(prev || {}), email }));
    setIsAuthenticated(true);
    verifyToken(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
