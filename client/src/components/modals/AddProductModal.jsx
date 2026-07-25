import React, { useState } from 'react';
import axios from 'axios';
import api from '../../services/api';
export default function AddProductModal({ isOpen, onClose, onProductAdded }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        name,
        price: Number(price)
      });
      alert('Đã thêm sản phẩm vào danh mục!');
      setName('');
      setPrice('');
      onProductAdded(); // Tải lại danh sách
      onClose();
    } catch (err) {
      alert('Lỗi khi thêm sản phẩm!');
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
              type="text" required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="VD: Tai nghe Bluetooth A2" 
              className="w-full border p-2 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">Giá Gốc / Đơn Giá (đ) *</label>
            <input 
              type="number" required 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              placeholder="VD: 500000" 
              className="w-full border p-2 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border rounded hover:bg-gray-100">Hủy</button>
            <button type="submit" className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded font-semibold hover:bg-blue-700">Lưu Sản Phẩm</button>
          </div>
        </form>
      </div>
    </div>
  );
}