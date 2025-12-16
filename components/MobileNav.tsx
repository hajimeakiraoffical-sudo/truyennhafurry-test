
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, Trophy, UploadCloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const { isTranslator } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'text-indigo-600 dark:text-indigo-400' 
      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#1E1F22]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe md:hidden transition-colors duration-300">
      <div className="flex items-center justify-around h-16">
        <Link to="/" className={`flex flex-col items-center gap-1 p-2 ${isActive('/')}`}>
          <Home size={22} />
          <span className="text-[10px] font-medium">Trang Chủ</span>
        </Link>
        
        <Link to="/genres" className={`flex flex-col items-center gap-1 p-2 ${isActive('/genres')}`}>
          <Layers size={22} />
          <span className="text-[10px] font-medium">Thể Loại</span>
        </Link>
        
        <Link to="/rankings" className={`flex flex-col items-center gap-1 p-2 ${isActive('/rankings')}`}>
          <Trophy size={22} />
          <span className="text-[10px] font-medium">BXH</span>
        </Link>

        {/* Nút Đăng Truyện chỉ dành cho Dịch Giả */}
        {isTranslator && (
          <Link to="/upload" className={`flex flex-col items-center gap-1 p-2 ${isActive('/upload')}`}>
            <UploadCloud size={22} />
            <span className="text-[10px] font-medium">Đăng</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default MobileNav;
