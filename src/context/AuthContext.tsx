import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api, setCurrentUserHeaderId } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  demoUsers: UserProfile[];
  loading: boolean;
  switchUser: (user: UserProfile) => void;
  login: (email: string, role?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [demoUsers, setDemoUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const initAuth = async () => {
    try {
      setLoading(true);
      const demoRes = await api.getDemoUsers();
      if (demoRes.success) {
        setDemoUsers(demoRes.users);
      }

      // Check saved user or default to student Priya
      const savedUserId = localStorage.getItem('canteeniq_active_user_id') || 'user_student_1';
      setCurrentUserHeaderId(savedUserId);

      const meRes = await api.getCurrentUser();
      if (meRes.success) {
        setUser(meRes.user);
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const switchUser = (selectedUser: UserProfile) => {
    setUser(selectedUser);
    setCurrentUserHeaderId(selectedUser.id);
    localStorage.setItem('canteeniq_active_user_id', selectedUser.id);
  };

  const login = async (email: string, role?: string) => {
    const res = await api.login(email, role);
    if (res.success) {
      switchUser(res.user);
    }
  };

  const logout = () => {
    // Return to demo student
    const defaultStudent = demoUsers.find((u) => u.role === 'student') || null;
    if (defaultStudent) {
      switchUser(defaultStudent);
    } else {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getCurrentUser();
      if (res.success) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        demoUsers,
        loading,
        switchUser,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
