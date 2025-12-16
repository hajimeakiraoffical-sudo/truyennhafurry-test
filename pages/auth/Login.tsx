
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [loginId, setLoginId] = useState(''); // Can be email or username
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginId && password) {
       const success = await login(loginId, password);
       if (success) {
         navigate('/');
       }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
       <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 dark:border-slate-700">
          <div className="text-center mb-8">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <LogIn size={24} />
             </div>
             <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Đăng Nhập</h1>
             <p className="text-slate-500 dark:text-slate-400 mt-2">Chào mừng trở lại với Truyện Nhà Furry</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email hoặc Tên đăng nhập</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="name@example.com hoặc username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu</label>
                <input 
                  type="password" 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
             </div>
             
             <button disabled={loading} type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2">
                {loading && <Loader2 className="animate-spin" size={20} />}
                {loading ? 'Đang kiểm tra...' : 'Đăng Nhập'}
             </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
             Chưa có tài khoản? <Link to="/signup" className="text-indigo-600 hover:underline font-medium">Đăng ký ngay</Link>
          </div>
       </div>
    </div>
  );
};

export default Login;