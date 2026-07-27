import React, { useState } from 'react';
import { Lock, User, LogIn, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export default function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Axios trả về dữ liệu trực tiếp trong res.data
      const res = await api.post('/login', { username, password });
      const data = res.data;

      // Lưu thông tin người dùng vào localStorage
      localStorage.setItem('oms_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      // Axios tự động nhảy vào catch nếu API trả về mã lỗi (400, 401, 500,...)
      const errorMessage = err.response?.data?.error 
        || err.response?.data?.message 
        || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu!';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng Nhập OMS</h1>
          <p className="text-xs text-gray-500">Nhập tài khoản để tiếp tục truy cập hệ thống</p>
        </div>

        {/* THÔNG BÁO LỖI */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl text-center font-medium animate-fade-in">
            {error}
          </div>
        )}

        {/* FORM ĐĂNG NHẬP */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tài khoản</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên tài khoản"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : (
              <>
                <LogIn size={16} /> Đăng Nhập
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}