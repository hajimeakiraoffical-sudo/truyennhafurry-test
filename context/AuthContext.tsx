
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Announcement } from '../types';

interface AuthContextType {
  user: User | null;
  login: (loginId: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, isTranslator: boolean) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (updatedUser: User) => Promise<boolean>;
  getPublicUserProfile: (userId: string) => Promise<User | null>;
  getAllUsers: () => Promise<User[]>;
  updateFullUserDatabase: (users: User[]) => Promise<boolean>;
  toggleUserVerification: (userId: string) => Promise<boolean>;
  toggleAdminRole: (userId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateAnnouncement: (announcement: Announcement) => Promise<boolean>;
  isAuthenticated: boolean;
  isTranslator: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('app_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('app_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('app_user');
    }
  }, [user]);

  // --- API CALLS TO PHP ---

  const login = async (loginId: string, password: string) => {
    setLoading(true);
    try {
        const formData = new FormData();
        formData.append('action', 'login');
        formData.append('loginId', loginId);
        formData.append('password', password);

        const res = await fetch('/api.php', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            setUser(data.user);
            return true;
        } else {
            alert(data.message || "Đăng nhập thất bại");
            return false;
        }
    } catch (e) {
        console.error(e);
        alert("Lỗi kết nối Server");
        return false;
    } finally {
        setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, isTranslator: boolean) => {
    setLoading(true);
    try {
        const formData = new FormData();
        formData.append('action', 'signup');
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('isTranslator', String(isTranslator));

        const res = await fetch('/api.php', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            // Sau khi đăng ký thành công, tự động đăng nhập luôn
            await login(name, password); // Hoặc email
            return true;
        } else {
            alert(data.message);
            return false;
        }
    } catch (e) {
        alert("Lỗi kết nối Server");
        return false;
    } finally {
        setLoading(false);
    }
  };

  const updateUserProfile = async (updatedUser: User) => {
      setLoading(true);
      try {
          const formData = new FormData();
          formData.append('action', 'update_profile');
          formData.append('id', updatedUser.id);
          formData.append('name', updatedUser.name);
          formData.append('description', updatedUser.description || '');
          formData.append('avatar', updatedUser.avatar || '');
          formData.append('cover', updatedUser.cover || '');

          const res = await fetch('/api.php', { method: 'POST', body: formData });
          const data = await res.json();

          if (data.success) {
              setUser(prev => prev ? { ...prev, ...updatedUser } : null);
              return true;
          }
          return false;
      } catch (e) {
          console.error(e);
          return false;
      } finally {
          setLoading(false);
      }
  };

  const getPublicUserProfile = async (userId: string): Promise<User | null> => {
      try {
          const formData = new FormData();
          formData.append('action', 'get_user_profile');
          formData.append('userId', userId);
          
          const res = await fetch('/api.php', { method: 'POST', body: formData });
          const data = await res.json();
          
          if (data.success) return data.user;
          return null;
      } catch (e) {
          return null;
      }
  };
  
  const getAllUsers = async (): Promise<User[]> => {
      try {
          const res = await fetch('/api.php?action=get_users');
          const data = await res.json();
          return Array.isArray(data) ? data : [];
      } catch (e) {
          return [];
      }
  };

  const adminAction = async (type: string, targetId: string) => {
      setLoading(true);
      try {
          const formData = new FormData();
          formData.append('action', 'admin_action');
          formData.append('type', type);
          formData.append('targetId', targetId);
          await fetch('/api.php', { method: 'POST', body: formData });
          return true;
      } catch (e) {
          return false;
      } finally {
          setLoading(false);
      }
  };

  const toggleUserVerification = async (userId: string) => adminAction('toggle_verify', userId);
  const toggleAdminRole = async (userId: string) => adminAction('toggle_role', userId);
  const deleteUser = async (userId: string) => adminAction('delete_user', userId);

  // Deprecated but kept for type compatibility if needed, though mostly unused now for users
  const updateFullUserDatabase = async (users: User[]) => { return true; };

  const updateAnnouncement = async (announcement: Announcement) => {
    setLoading(true);
    try {
        const formData = new FormData();
        formData.append('action', 'save_data');
        formData.append('type', 'announcement');
        formData.append('content', JSON.stringify(announcement, null, 2));

        const res = await fetch('/api.php', { method: 'POST', body: formData });
        const data = await res.json();
        return data.success;
    } catch (e) {
        return false;
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
        user, login, signup, logout, 
        updateUserProfile, getPublicUserProfile, getAllUsers,
        updateFullUserDatabase, toggleUserVerification, toggleAdminRole, deleteUser,
        updateAnnouncement,
        isAuthenticated: !!user,
        isTranslator: user?.role === 'translator' || user?.role === 'admin',
        isAdmin: user?.role === 'admin',
        loading
    }}>
      {children}
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
