
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Moon, Sun, Globe, Check, UploadCloud, LogIn, User as UserIcon, LogOut, Shield, HelpCircle, EyeOff, Eye, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BackgroundTheme } from '../types';

const Navbar: React.FC = () => {
  const { theme, toggleTheme, language, setLanguage, showNSFW, toggleNSFW, backgroundTheme, setBackgroundTheme } = useTheme();
  const { user, logout, isTranslator, isAdmin } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400';

  // Define colors for the picker UI - Updated to match the requested image style
  const themeColors: { id: BackgroundTheme, background: string, name: string }[] = [
    // Default: Neutral
    { id: 'default', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', name: 'Cổ điển' }, 
    // Ocean: Blue/Purple mix (The "Selected" one in image)
    { id: 'ocean', background: 'linear-gradient(135deg, #c7d2fe, #dbeafe, #cffafe)', name: 'Bầu trời' }, 
    // Forest: Minty Green
    { id: 'forest', background: 'linear-gradient(135deg, #d1fae5, #ccfbf1, #bbf7d0)', name: 'Bạc hà' }, 
    // Sunset: Peach/Orange
    { id: 'sunset', background: 'linear-gradient(135deg, #ffedd5, #fef3c7, #fecdd3)', name: 'Đào tiên' }, 
    // Lavender: Pink/Purple
    { id: 'lavender', background: 'linear-gradient(135deg, #fae8ff, #fce7f3, #e9d5ff)', name: 'Mộng mơ' }, 
  ];

  // Dark mode previews - Deep rich colors
  const getPreviewStyle = (t: { id: string, background: string }) => {
     if (theme === 'dark') {
         switch(t.id) {
             case 'default': return { background: 'linear-gradient(135deg, #2b2d31, #313338)' }; // Dark Gray
             case 'ocean': return { background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #312e81)' }; // Deep Indigo
             case 'forest': return { background: 'linear-gradient(135deg, #022c22, #064e3b, #115e59)' }; // Deep Jungle
             case 'sunset': return { background: 'linear-gradient(135deg, #451a03, #7c2d12, #991b1b)' }; // Deep Magma
             case 'lavender': return { background: 'linear-gradient(135deg, #2e1065, #4c1d95, #701a75)' }; // Deep Cosmic
             default: return { background: t.background };
         }
     }
     return { background: t.background };
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
                <img 
                    src="https://getwallpapers.com/wallpaper/full/a/c/b/451101.jpg" 
                    alt="Logo" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-indigo-600 shadow-md group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
            </div>
            <div className="flex flex-col">
                <span className="font-display font-black text-xl leading-none text-slate-800 dark:text-white tracking-tight uppercase">
                TRUYỆN NHÀ <span className="text-indigo-600 dark:text-indigo-400">FURRY</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase font-display">
                Thế Giới Furry
                </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/')}`}>
              Trang Chủ
            </Link>
            <Link to="/genres" className={`text-sm font-medium transition-colors ${isActive('/genres')}`}>
              Thể Loại
            </Link>
            <Link to="/rankings" className={`text-sm font-medium transition-colors ${isActive('/rankings')}`}>
              Bảng Xếp Hạng
            </Link>
            <Link to="/guide" className={`text-sm font-medium transition-colors ${isActive('/guide')}`}>
              Hướng Dẫn
            </Link>
             {/* Admin Dashboard Link - Desktop Main Menu */}
             {isAdmin && (
                <Link to="/admin" className={`text-sm font-bold flex items-center gap-1 transition-colors ${location.pathname === '/admin' ? 'text-red-600' : 'text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400'}`}>
                    <Shield size={16} />
                    Admin
                </Link>
            )}
          </div>

          {/* Action / Settings */}
          <div className="flex items-center gap-3">
             
             {/* Upload Button (Only for Translators - Desktop) */}
             {isTranslator && (
                <Link 
                    to="/upload" 
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
                >
                    <UploadCloud size={18} />
                    <span>Đăng Truyện</span>
                </Link>
             )}

             {/* User Auth Buttons (Desktop) */}
             {user ? (
                 <div className="hidden md:flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {user.name}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-indigo-100 overflow-hidden border border-indigo-200">
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                 </div>
             ) : (
                <Link 
                    to="/login"
                    className="hidden md:flex items-center gap-2 px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                >
                    Đăng Nhập
                </Link>
             )}

             {/* Mobile Avatar Button (Next to Settings) */}
             {user && (
                 <Link 
                    to={`/profile/${user.id}`}
                    className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden"
                 >
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                 </Link>
             )}

             {/* Settings Dropdown */}
             <div className="relative">
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                >
                  <Settings size={20} />
                </button>

                {isSettingsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsSettingsOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 z-20 animate-in fade-in slide-in-from-top-2">
                       
                       {/* Mobile Auth Info Header */}
                       {user ? (
                           <div className="md:hidden flex items-center gap-3 p-2 mb-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 overflow-hidden">
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role === 'translator' ? 'Dịch giả' : user.role === 'admin' ? 'Admin' : 'Thành viên'}</p>
                                </div>
                           </div>
                       ) : (
                           <div className="md:hidden grid grid-cols-2 gap-2 mb-4">
                               <Link to="/login" onClick={() => setIsSettingsOpen(false)} className="py-2 text-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                                   Đăng nhập
                               </Link>
                               <Link to="/signup" onClick={() => setIsSettingsOpen(false)} className="py-2 text-center rounded-lg bg-indigo-600 text-white text-sm font-bold">
                                   Đăng ký
                               </Link>
                           </div>
                       )}

                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cài đặt chung</h3>
                       
                       {/* Dark Mode */}
                       <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 mb-2 cursor-pointer" onClick={toggleTheme}>
                          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                             {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                             <span className="text-sm font-medium">Giao diện</span>
                          </div>
                          <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                             <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                          </div>
                       </div>
                       
                       {/* Background Theme Picker (Gradient) */}
                       <div className="p-2 mb-2">
                           <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 mb-2">
                              <Palette size={18} />
                              <span className="text-sm font-medium">Chủ đề (Gradient)</span>
                           </div>
                           <div className="grid grid-cols-5 gap-2">
                              {themeColors.map((t) => (
                                  <button
                                    key={t.id}
                                    onClick={() => setBackgroundTheme(t.id)}
                                    title={t.name}
                                    className={`w-9 h-9 rounded-md border-2 flex items-center justify-center transition-all shadow-sm ${backgroundTheme === t.id ? 'border-indigo-600 scale-110 ring-2 ring-indigo-200 dark:ring-indigo-900' : 'border-slate-200 dark:border-slate-700 hover:scale-105'}`}
                                    style={getPreviewStyle(t)}
                                  >
                                      {backgroundTheme === t.id && <div className="bg-white dark:bg-black/50 rounded-full p-0.5"><Check size={12} className="text-indigo-600 dark:text-white" strokeWidth={4} /></div>}
                                  </button>
                              ))}
                           </div>
                       </div>

                       {/* NSFW Toggle */}
                       <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 mb-2 cursor-pointer" onClick={toggleNSFW}>
                          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                             {showNSFW ? <Eye size={18} className="text-red-500" /> : <EyeOff size={18} />}
                             <span className="text-sm font-medium">Nội dung 18+</span>
                          </div>
                          <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ${showNSFW ? 'bg-red-500' : 'bg-slate-200'}`}>
                             <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${showNSFW ? 'translate-x-4' : 'translate-x-0'}`}></div>
                          </div>
                       </div>

                       {/* Links */}
                       <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
                            <Link to="/guide" onClick={() => setIsSettingsOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200">
                                <HelpCircle size={18} />
                                <span className="text-sm font-medium">Hướng dẫn sử dụng</span>
                            </Link>
                       </div>

                       {/* Profile Link (Desktop Only - Mobile uses Avatar Button) */}
                       {user && (
                            <div className="space-y-1">
                                <Link to={`/profile/${user.id}`} onClick={() => setIsSettingsOpen(false)} className="hidden md:flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200">
                                    <UserIcon size={18} />
                                    <span className="text-sm font-medium">Trang cá nhân</span>
                                </Link>
                                {isAdmin && (
                                   <Link to="/admin" onClick={() => setIsSettingsOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-red-600 dark:text-red-400 md:hidden">
                                      <Shield size={18} />
                                      <span className="text-sm font-medium">Admin Dashboard</span>
                                  </Link>
                                )}
                            </div>
                       )}

                       {/* Language */}
                       <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 px-2">
                             <Globe size={16} />
                             <span className="text-sm font-medium">Ngôn ngữ</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                             <button 
                              onClick={() => setLanguage('vi')}
                              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all ${language === 'vi' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                             >
                                VN {language === 'vi' && <Check size={14} />}
                             </button>
                             <button 
                              onClick={() => setLanguage('en')}
                               className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all ${language === 'en' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                             >
                                EN {language === 'en' && <Check size={14} />}
                             </button>
                          </div>
                       </div>

                       {/* Logout */}
                       {user && (
                            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                                <button onClick={() => { logout(); setIsSettingsOpen(false); }} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors">
                                    <LogOut size={18} />
                                    <span className="text-sm font-medium">Đăng xuất</span>
                                </button>
                            </div>
                       )}

                    </div>
                  </>
                )}
             </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
