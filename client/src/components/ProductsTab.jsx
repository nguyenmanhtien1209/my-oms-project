import React, { useState } from 'react';
import { Plus, Search, Trash2, Package } from 'lucide-react';
import api from '../services/api';
export default function ProductsTab({ products, fetchProducts, setIsAddProductOpen }) {
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
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-blue-600" /> Danh Mục Sản Phẩm
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Quản lý các sản phẩm và đơn giá niêm yết</p>
        </div>

        <button 
          onClick={() => setIsAddProductOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow hover:shadow-md transition-all"
        >
          <Plus size={16} /> Thêm Sản Phẩm Mới
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Tìm kiếm sản phẩm theo tên..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* PRODUCT TABLE */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b text-gray-600 uppercase font-semibold">
            <tr>
              <th className="p-4">STT</th>
              <th className="p-4">Tên Sản Phẩm</th>
              <th className="p-4">Đơn Giá Niêm Yết</th>
              <th className="p-4">Ngày Tạo</th>
              <th className="p-4 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-500">{idx + 1}</td>
                  <td className="p-4 font-bold text-gray-800">{p.name}</td>
                  <td className="p-4 font-extrabold text-blue-600">
                    {Number(p.price).toLocaleString()} đ
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