import React, { useState } from 'react';
import { Plus, Search, Trash2, Package, Tag, Calendar } from 'lucide-react';
import api from '../services/api';

export default function ProductsTab({ products = [], fetchProducts, setIsAddProductOpen }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name}" khỏi danh mục?`)) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert('Lỗi khi xóa sản phẩm!');
      }
    }
  };

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Package size={22} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">Danh Mục Sản Phẩm</h1>
            <p className="text-xs text-gray-500">Quản lý các sản phẩm và đơn giá niêm yết</p>
          </div>
        </div>

        <button 
          onClick={() => setIsAddProductOpen(true)}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow hover:shadow-md transition-all"
        >
          <Plus size={16} /> Thêm Sản Phẩm Mới
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Tìm kiếm sản phẩm theo tên..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      {/* GIAO DIỆN THẺ MOBILE (< 768px) */}
      <div className="block md:hidden space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p, idx) => (
            <div key={p.id || idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                  <h3 className="font-bold text-gray-800 text-sm truncate">{p.name}</h3>
                </div>
                
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-extrabold text-blue-600 flex items-center gap-1">
                    <Tag size={12} className="text-blue-500" />
                    {Number(p.price || 0).toLocaleString('vi-VN')} đ
                  </span>
                  {p.createdAt && (
                    <span className="text-gray-400 text-[11px] flex items-center gap-1">
                      <Calendar size={12} />
                      {p.createdAt}
                    </span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => handleDelete(p.id, p.name)}
                className="p-2 text-red-500 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                title="Xóa sản phẩm"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-400 text-xs font-medium">
            Chưa có sản phẩm nào trong danh mục.
          </div>
        )}
      </div>

      {/* GIAO DIỆN BẢNG DESKTOP (>= 768px) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 uppercase font-semibold">
            <tr>
              <th className="p-4 w-16">STT</th>
              <th className="p-4">Tên Sản Phẩm</th>
              <th className="p-4">Đơn Giá Niêm Yết</th>
              <th className="p-4">Ngày Tạo</th>
              <th className="p-4 text-center w-24">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-4 font-medium text-gray-400">{idx + 1}</td>
                  <td className="p-4 font-bold text-gray-800">{p.name}</td>
                  <td className="p-4 font-extrabold text-blue-600">
                    {Number(p.price || 0).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-4 text-gray-500">{p.createdAt || 'N/A'}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400 font-medium">
                  Chưa có sản phẩm nào trong danh mục.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}