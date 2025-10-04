import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, remember?: boolean) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  rememberedUsers: User[];
  forgetUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [rememberedUsers, setRememberedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('proexpense_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      const storedRemembered = localStorage.getItem('proexpense_remembered_users');
      if (storedRemembered) {
        setRememberedUsers(JSON.parse(storedRemembered));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      localStorage.removeItem('proexpense_user');
      localStorage.removeItem('proexpense_remembered_users');
    }
    setLoading(false);
  }, []);

  const rememberUser = (userToRemember: User) => {
    setRememberedUsers(prev => {
        const userExists = prev.some(u => u.id === userToRemember.id);
        if (userExists) return prev;
        const newRemembered = [...prev, userToRemember];
        localStorage.setItem('proexpense_remembered_users', JSON.stringify(newRemembered));
        return newRemembered;
    });
  };

  const forgetUser = (userId: string) => {
      setRememberedUsers(prev => {
          const newRemembered = prev.filter(u => u.id !== userId);
          localStorage.setItem('proexpense_remembered_users', JSON.stringify(newRemembered));
          return newRemembered;
      });
  };


  const login = (userData: User, remember: boolean = false) => {
    localStorage.setItem('proexpense_user', JSON.stringify(userData));
    setUser(userData);
    if (remember) {
        rememberUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('proexpense_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, rememberedUsers, forgetUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};