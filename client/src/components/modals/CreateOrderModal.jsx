import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import AddProductModal from './AddProductModal';
import api from '../../services/api';
export default function CreateOrderModal({ isOpen, onClose, fetchAllData }) {
  const [productsList, setProductsList] = useState([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    customer: '',
    phone: '',
    product: '',
    productId: null,
    productPrice: 0,   // Giá gốc
    sellingPrice: 0,    // Giá bán
    quantity: 1,
    amount: 0,          // Tổng tiền = Giá gốc * Số lượng
    platform: 'Shopee',
    status: 'Mới tạo',  // Mặc định là Mới tạo
    createdDate: new Date().toISOString().split('T')[0]
  });

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProductsList(res.data);
    } catch (err) {
      console.error('Lỗi lấy danh sách sản phẩm:', err);
    }
  };

  useEffect(() => {
    if (isOpen) fetchProducts();
  }, [isOpen]);

  if (!isOpen) return null;

  // Khi chọn Sản phẩm -> Lấy Giá gốc từ DB và tính Tổng tiền
  const handleSelectProduct = (e) => {
    const selectedId = Number(e.target.value);
    const foundProduct = productsList.find(p => p.id === selectedId);

    if (foundProduct) {
      const pPrice = Number(foundProduct.price);
      const qty = Number(formData.quantity || 1);
      setFormData({
        ...formData,
        product: foundProduct.name,
        productId: foundProduct.id,
        productPrice: pPrice,
        amount: pPrice * qty
      });
    }
  };

  // Thay đổi Giá Gốc thủ công -> Tự động tính lại Tổng tiền
  const handleProductPriceChange = (val) => {
    const pPrice = Number(val || 0);
    const qty = Number(formData.quantity || 1);
    setFormData({
      ...formData,
      productPrice: val,
      amount: pPrice * qty
    });
  };

  // Thay đổi Số lượng -> Tự động tính lại Tổng tiền
  const handleQtyChange = (val) => {
    const qty = Number(val || 1);
    const pPrice = Number(formData.productPrice || 0);
    setFormData({
      ...formData,
      quantity: val,
      amount: pPrice * qty
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/orders', formData);
      fetchAllData();
      onClose();
    } catch (err) {
      alert('Lỗi tạo đơn hàng!');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
          <h2 className="text-lg font-bold mb-4 text-gray-800">Tạo Đơn Hàng Mới</h2>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* MÃ ĐƠN, SÀN & TRẠNG THÁI */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-600">Mã Đơn *</label>
                <input 
                  type="text" required 
                  value={formData.id} 
                  onChange={e => setFormData({...formData, id: e.target.value})} 
                  className="w-full border p-2 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Sàn TMĐT</label>
                <select 
                  value={formData.platform} 
                  onChange={e => setFormData({...formData, platform: e.target.value})} 
                  className="w-full border p-2 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Shopee">Shopee</option>
                  <option value="TikTok Shop">TikTok Shop</option>
                  <option value="Lazada">Lazada</option>
                  <option value="Bán Ngoài">Bán Ngoài / Direct</option>
                </select>
              </div>

              {/* TRẠNG THÁI ĐƠN HÀNG (CÓ ĐƠN ĐỔI) */}
              <div>
                <label className="text-xs font-semibold text-gray-600">Trạng Thái</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value})} 
                  className="w-full border p-2 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Mới tạo">Mới tạo</option>
                  <option value="Đang giao hàng">Đang giao hàng</option>
                  <option value="Đã giao thành công">Đã giao thành công</option>
                  <option value="Đơn đổi">Đơn đổi</option>
                  <option value="Giao hàng không thành công">Giao thất bại (Bom)</option>
                  <option value="Trả hàng/Hoàn tiền">Trả hàng/Hoàn tiền</option>
                  <option value="Đã hủy">Đã hủy</option>
                </select>
              </div>
            </div>

            {/* DROP DOWN CHỌN SẢN PHẨM TỪ DANH MỤC */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-600">Chọn Sản Phẩm Từ Danh Mục *</label>
                <button 
                  type="button" 
                  onClick={() => setIsAddProductOpen(true)}
                  className="text-[11px] text-blue-600 font-semibold flex items-center gap-0.5 hover:underline"
                >
                  <Plus size={12} /> + Thêm SP Mới
                </button>
              </div>
              <select 
                value={formData.productId || ''} 
                onChange={handleSelectProduct}
                required
                className="w-full border p-2 rounded text-sm bg-blue-50/50 font-medium text-gray-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn Sản Phẩm --</option>
                {productsList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ({Number(p.price).toLocaleString()} đ)
                  </option>
                ))}
              </select>
            </div>

            {/* CỤM ĐIỀN GIÁ GỐC, GIÁ BÁN, SỐ LƯỢNG & TỔNG TIỀN */}
            <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              
              {/* Ô GIÁ GỐC */}
              <div>
                <label className="text-[11px] font-semibold text-gray-600">Giá Gốc (đ)</label>
                <input 
                  type="number" 
                  value={formData.productPrice} 
                  onChange={e => handleProductPriceChange(e.target.value)} 
                  className="w-full border bg-white p-1.5 rounded text-xs mt-1 font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              {/* Ô GIÁ BÁN */}
              <div>
                <label className="text-[11px] font-bold text-blue-700">Giá Bán (đ)</label>
                <input 
                  type="number" 
                  value={formData.sellingPrice} 
                  onChange={e => setFormData({...formData, sellingPrice: e.target.value})} 
                  placeholder="0"
                  className="w-full border border-blue-400 bg-white p-1.5 rounded text-xs mt-1 font-bold text-blue-700 focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              {/* SỐ LƯỢNG */}
              <div>
                <label className="text-[11px] font-semibold text-gray-600">Số Lượng</label>
                <input 
                  type="number" min="1" 
                  value={formData.quantity} 
                  onChange={e => handleQtyChange(e.target.value)} 
                  className="w-full border p-1.5 rounded text-xs mt-1 font-bold" 
                />
              </div>

              {/* TỔNG TIỀN = GIÁ GỐC * SỐ LƯỢNG */}
              <div>
                <label className="text-[11px] font-semibold text-gray-600">Tổng Tiền (đ)</label>
                <input 
                  type="text" 
                  value={Number(formData.amount).toLocaleString()} 
                  readOnly 
                  className="w-full border bg-gray-100 p-1.5 rounded text-xs mt-1 font-extrabold text-blue-600" 
                />
              </div>
            </div>

            {/* KHÁCH HÀNG & SĐT */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Khách Hàng</label>
                <input 
                  type="text" 
                  value={formData.customer} 
                  onChange={e => setFormData({...formData, customer: e.target.value})} 
                  className="w-full border p-2 rounded text-sm mt-1" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Số Điện Thoại</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  className="w-full border p-2 rounded text-sm mt-1" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border rounded hover:bg-gray-100">Hủy</button>
              <button type="submit" className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold">Tạo Đơn Hàng</button>
            </div>
          </form>
        </div>
      </div>

      <AddProductModal 
        isOpen={isAddProductOpen} 
        onClose={() => setIsAddProductOpen(false)} 
        onProductAdded={fetchProducts} 
      />
    </>
  );
}