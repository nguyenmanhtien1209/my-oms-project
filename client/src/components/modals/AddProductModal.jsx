import React, { useState } from 'react';
import { X, Package, Plus, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function AddProductModal({ isOpen, onClose, onProductAdded }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await api.post('/products', {
        name: name.trim(),
        price: Number(price)
      });
      
      alert('Đã thêm sản phẩm vào danh mục!');
      setName('');
      setPrice('');
      if (onProductAdded) onProductAdded();
      onClose();
    } catch (err) {
      console.error("Lỗi thêm sản phẩm:", err);
      const errorMsg = err.response?.data?.message || 'Lỗi khi thêm sản phẩm!';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setPrice('');
      onClose();
    }
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-opacity"
    >
      {/* Thêm max-h-[90vh] và overflow-y-auto chống tràn khi mở bàn phím ảo di động */}
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-800">Thêm Sản Phẩm Mới</h2>
              <p className="text-[11px] text-gray-500">Thêm mặt hàng vào danh mục niêm yết</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* FORM NHẬP DỮ LIỆU */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tên Sản Phẩm <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="VD: Tai nghe Bluetooth A2" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Đơn Giá Niêm Yết (đ) <span className="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              required 
              min="0"
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              placeholder="VD: 500000" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
            />
            {/* Hiển thị xem trước định dạng tiền */}
            {price && !isNaN(price) && Number(price) > 0 && (
              <p className="text-[11px] text-blue-600 font-semibold mt-1">
                Xem trước: {Number(price).toLocaleString('vi-VN')} đ
              </p>
            )}
          </div>

          {/* NÚT THAO TÁC */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button 
              type="button" 
              onClick={handleClose} 
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition disabled:opacity-50"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Lưu Sản Phẩm</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}