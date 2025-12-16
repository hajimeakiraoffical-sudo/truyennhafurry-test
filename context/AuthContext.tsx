
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

// Thông tin Admin mặc định (Chỉ dùng khi chưa có trong database)
const DEFAULT_ADMIN: User = {
    id: 'admin_hajime',
    name: 'Hajime Akira',
    email: 'hajime@admin.com',
    role: 'admin',
    avatar: 'https://scontent.fdad3-5.fna.fbcdn.net/v/t39.30808-6/544533728_122100826857006527_5979843460901351772_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=fTP35Nlg6zgQ7kNvwFCn6Jt&_nc_oc=AdljNfASGMEF6bRxI3pOtaiHTjxR-jkeQxQHjmyYJoyi0rXIBs-iCsrWmd6x-22ZG_4&_nc_zt=23&_nc_ht=scontent.fdad3-5.fna&_nc_gid=x6FrW9OmuelvU-7OWy9AwA&oh=00_AfmjfWysDvRjABlKaiscukzCouxWlBYQ6Pjew811i4BdBA&oe=693C97AE',
    cover: 'https://rare-gallery.com/mocahbig/412583-furry-muscles-Anthro.jpg',
    description: 'Quản trị viên hệ thống Truyện Nhà Furry',
    isVerified: true,
    joinedAt: '2023-01-01T00:00:00.000Z'
};

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

  // Helper: Fetch users from local JSON file
  const fetchUsersLocal = async (): Promise<any[]> => {
    try {
        const res = await fetch('/users.json?t=' + Date.now());
        if (res.ok) {
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
    } catch (e) {
        console.warn("User DB not found (fresh install?)", e);
    }
    return [];
  };

  // Helper: Save users array to server via PHP
  const saveUsersToLocal = async (users: any[]) => {
      const formData = new FormData();
      formData.append('action', 'save_data');
      formData.append('type', 'users');
      formData.append('content', JSON.stringify(users, null, 2));

      const res = await fetch('/api.php', {
          method: 'POST',
          body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return true;
  };

  const login = async (loginId: string, password: string) => {
    setLoading(true);
    try {
        const users = await fetchUsersLocal();

        // 1. Kiểm tra đăng nhập Admin: BỎ QUA KIỂM TRA PASSWORD
        // Chỉ cần nhập đúng tên là vào được quyền Admin
        if (loginId === 'Hajime Akira') {
             // Tìm xem Admin đã có trong database chưa
             const dbAdmin = users.find((u: any) => u.id === 'admin_hajime');
             
             if (dbAdmin) {
                 setUser(dbAdmin as User);
             } else {
                 const newUsers = [...users, { ...DEFAULT_ADMIN, password: 'admin_password_hidden' }];
                 await saveUsersToLocal(newUsers);
                 setUser(DEFAULT_ADMIN);
             }
             return true;
        }

        // 2. Logic đăng nhập User thường (Cũng bỏ qua mật khẩu như yêu cầu trước đó)
        let foundUser = users.find((u: any) => 
            (u.email === loginId || u.name === loginId)
        );

        if (foundUser) {
           const { password: _, ...safeUser } = foundUser;
           setUser(safeUser as User);
           return true;
        } else {
           // Tự động tạo user mới nếu chưa có
           const fakeEmail = loginId.includes('@') ? loginId : `${loginId.toLowerCase().replace(/\s+/g, '')}@example.com`;
           const newUser = {
                id: 'u_' + Date.now(),
                name: loginId,
                email: fakeEmail,
                password: password, 
                role: 'user' as const,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${loginId}`,
                description: 'Thành viên mới',
                isVerified: false,
                joinedAt: new Date().toISOString()
           };

           await saveUsersToLocal([...users, newUser]);

           const { password: _, ...safeUser } = newUser;
           setUser(safeUser as User);
           return true;
        }
    } catch (e: any) {
        alert(`Lỗi đăng nhập: ${e.message}`);
        return false;
    } finally {
        setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, isTranslator: boolean) => {
    setLoading(true);
    try {
        const currentUsers = await fetchUsersLocal();

        if (currentUsers.some((u: any) => u.email === email || u.name === name)) {
            alert("Email hoặc Tên hiển thị đã được đăng ký!");
            return false;
        }

        const role: 'user' | 'translator' = isTranslator ? 'translator' : 'user';
        const newUser = {
            id: 'u_' + Date.now(),
            name: name,
            email: email,
            password: password,
            role: role,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            description: '',
            isVerified: false,
            joinedAt: new Date().toISOString() // Save current time as join date
        };

        const updatedUsers = [...currentUsers, newUser];
        await saveUsersToLocal(updatedUsers);

        const { password: pw, ...safeUser } = newUser;
        setUser(safeUser as User);
        return true;

    } catch (e: any) {
        alert(`Đăng ký thất bại: ${e.message}`);
        return false;
    } finally {
        setLoading(false);
    }
  };

  const updateUserProfile = async (updatedUser: User) => {
      setLoading(true);
      try {
          const users = await fetchUsersLocal();
          const index = users.findIndex((u: any) => u.id === updatedUser.id);
          
          if (index === -1) {
              if (updatedUser.id === 'admin_hajime') {
                  users.push({ ...updatedUser, password: 'admin_password_hidden' });
              } else {
                  throw new Error("User not found");
              }
          } else {
              users[index] = { 
                  ...users[index], 
                  ...updatedUser,
                  password: users[index].password || 'default123' 
              };
          }

          await saveUsersToLocal(users);
          setUser(updatedUser);
          return true;
      } catch (e) {
          console.error(e);
          alert("Lỗi cập nhật hồ sơ.");
          return false;
      } finally {
          setLoading(false);
      }
  };

  const getPublicUserProfile = async (userId: string): Promise<User | null> => {
      if (user && (user.id === userId || user.name === userId)) return user;

      const users = await fetchUsersLocal();
      const found = users.find((u: any) => u.id === userId || u.name === userId || u.uploader === userId);
      
      if (found) {
          const { password, ...safeUser } = found;
          return safeUser as User;
      }
      
      if (userId === 'admin_hajime' || userId === 'Hajime Akira') {
          return DEFAULT_ADMIN;
      }

      return null;
  };
  
  const getAllUsers = async (): Promise<User[]> => {
      const users = await fetchUsersLocal();
      return users.map((u: any) => {
          const { password, ...safeUser } = u;
          return safeUser as User;
      });
  };

  const toggleUserVerification = async (userId: string): Promise<boolean> => {
      setLoading(true);
      try {
          const users = await fetchUsersLocal();
          const index = users.findIndex((u: any) => u.id === userId);
          if (index === -1) throw new Error("User not found");
          users[index].isVerified = !users[index].isVerified;
          await saveUsersToLocal(users);
          return true;
      } catch (e) {
          return false;
      } finally {
          setLoading(false);
      }
  };

  const toggleAdminRole = async (userId: string): Promise<boolean> => {
      setLoading(true);
      try {
          const users = await fetchUsersLocal();
          const index = users.findIndex((u: any) => u.id === userId);
          if (index === -1) throw new Error("User not found");

          if (users[index].role === 'admin') {
              users[index].role = 'translator';
          } else {
              users[index].role = 'admin';
          }

          await saveUsersToLocal(users);
          return true;
      } catch (e) {
          return false;
      } finally {
          setLoading(false);
      }
  };

  const updateFullUserDatabase = async (newUsersList: User[]) => {
      setLoading(true);
      try {
          const currentUsers = await fetchUsersLocal();
          const mergedUsers = newUsersList.map(updatedUser => {
              const existing = currentUsers.find((u: any) => u.id === updatedUser.id);
              return {
                  ...updatedUser,
                  password: existing ? existing.password : 'default123'
              };
          });
          await saveUsersToLocal(mergedUsers);
          return true;
      } catch (e) {
          return false;
      } finally {
          setLoading(false);
      }
  };

  const deleteUser = async (userId: string) => {
      setLoading(true);
      try {
          const users = await fetchUsersLocal();
          const newUsersList = users.filter((u: any) => u.id !== userId);
          await saveUsersToLocal(newUsersList);
          return true;
      } catch (e) {
          return false;
      } finally {
          setLoading(false);
      }
  };

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
        console.error("Error updating announcement", e);
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