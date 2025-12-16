
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, CheckCircle, Loader2 } from 'lucide-react';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isTranslator, setIsTranslator] = useState(false);
  
  const { signup, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && password) {
       const success = await signup(name, email, password, isTranslator);
       if (success) {
         // Show alert before navigating
         alert("Đăng ký thành công!");
         navigate('/');
       }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
       <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 dark:border-slate-700">
          <div className="text-center mb-8">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <UserPlus size={24} />
             </div>
             <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Đăng Ký Tài Khoản</h1>
             <p className="text-slate-500 dark:text-slate-400 mt-2">Tham gia cộng đồng Truyện Nhà Furry</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên hiển thị</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="Ví dụ: Sói Cô Độc"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
             
             {/* Translator Option */}
             <div 
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isTranslator ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700'}`}
                onClick={() => setIsTranslator(!isTranslator)}
             >
                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isTranslator ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-400'}`}>
                    {isTranslator && <CheckCircle size={14} className="text-white" />}
                </div>
                <div>
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer block">
                       Đăng ký làm Dịch Giả
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Chọn tùy chọn này nếu bạn muốn đăng và quản lý truyện của mình trên nền tảng.
                    </p>
                </div>
             </div>

             <button disabled={loading} type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2">
                {loading && <Loader2 className="animate-spin" size={20} />}
                {loading ? 'Đang cập nhật GitHub...' : 'Đăng Ký'}
             </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
             Đã có tài khoản? <Link to="/login" className="text-indigo-600 hover:underline font-medium">Đăng nhập</Link>
          </div>
       </div>
    </div>
  );
};

export default Signup;
