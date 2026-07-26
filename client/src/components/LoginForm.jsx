import React, { useState } from 'react';
import { Lock, User, LogIn, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
        || 'Đăng nhập thất bại. Vui lòng thử lại!';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng Nhập</h1>
          <p className="text-xs text-gray-500">Nhập tài khoản để tiếp tục truy cập dữ liệu</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tài khoản</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tài khoản"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : <><LogIn size={16} /> Đăng Nhập</>}
          </button>
        </form>
      </div>
    </div>
  );
}