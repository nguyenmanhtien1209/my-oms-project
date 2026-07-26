// AddProductModal.jsx
import React, { useState } from 'react';
import api from '../../services/api'; // Đã xóa import axios thừa

export default function AddProductModal({ isOpen, onClose, onProductAdded }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false); // Thêm state loading

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Tránh submit 2 lần

    setLoading(true);
    try {
      await api.post('/products', {
        name,
        price: Number(price)
      });
      
      alert('Đã thêm sản phẩm vào danh mục!');
      setName('');
      setPrice('');
      if (onProductAdded) onProductAdded(); // Tải lại danh sách
      onClose();
    } catch (err) {
      console.error("Lỗi thêm sản phẩm:", err);
      const errorMsg = err.response?.data?.message || 'Lỗi khi thêm sản phẩm!';
      alert(errorMsg);
    } finally {
      setLoading(false); // Mở lại nút sau khi xử lý xong
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        <h2 className="text-lg font-bold mb-4 text-gray-800">Thêm Sản Phẩm Vào Danh Mục</h2>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">Tên Sản Phẩm *</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="VD: Tai nghe Bluetooth A2" 
              className="w-full border p-2 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">Giá Gốc / Đơn Giá (đ) *</label>
            <input 
              type="number" 
              required 
              min="0"
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              placeholder="VD: 500000" 
              className="w-full border p-2 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="px-3 py-1.5 text-xs border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              {loading ? 'Đang lưu...' : 'Lưu Sản Phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}