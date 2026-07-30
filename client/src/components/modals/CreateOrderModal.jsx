import React, { useState, useEffect } from 'react';
import { Plus, Loader2, X } from 'lucide-react';
import AddProductModal from './AddProductModal';
import api from '../../services/api';

export default function CreateOrderModal({ isOpen, onClose, fetchAllData }) {
  const [productsList, setProductsList] = useState([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const initialFormState = {
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
    status: 'Mới tạo',  
    createdDate: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProductsList(res.data || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách sản phẩm:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      // Reset form mỗi khi mở Modal
      setFormData({
        ...initialFormState,
        createdDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Chọn Sản phẩm -> Lấy Giá gốc từ DB và tính Tổng tiền
  const handleSelectProduct = (e) => {
    const selectedId = Number(e.target.value);
    const foundProduct = productsList.find(p => p.id === selectedId);

    if (foundProduct) {
      const pPrice = Number(foundProduct.price) || 0;
      const qty = Number(formData.quantity) || 1;
      setFormData(prev => ({
        ...prev,
        product: foundProduct.name,
        productId: foundProduct.id,
        productPrice: pPrice,
        amount: pPrice * qty
      }));
    }
  };

  // Thay đổi Giá Gốc -> Tự động tính lại Tổng tiền
  const handleProductPriceChange = (val) => {
    const pPrice = Number(val) || 0;
    const qty = Number(formData.quantity) || 1;
    setFormData(prev => ({
      ...prev,
      productPrice: val,
      amount: pPrice * qty
    }));
  };

  // Thay đổi Số lượng -> Tự động tính lại Tổng tiền
  const handleQtyChange = (val) => {
    const qty = Number(val) || 1;
    const pPrice = Number(formData.productPrice) || 0;
    setFormData(prev => ({
      ...prev,
      quantity: val,
      amount: pPrice * qty
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      // Ép kiểu dữ liệu chuẩn xác trước khi gửi API (Tránh MySQL Strict Mode 500)
      const payload = {
        ...formData,
        id: formData.id.trim(),
        customer: formData.customer ? formData.customer.trim() : '',
        phone: formData.phone ? formData.phone.trim() : '',
        productPrice: Number(formData.productPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        quantity: Number(formData.quantity) || 1,
        amount: Number(formData.amount) || 0,
        createdDate: formData.createdDate || new Date().toISOString().split('T')[0]
      };

      await api.post('/orders', payload);
      alert('Tạo đơn hàng thành công!');
      if (fetchAllData) fetchAllData();
      onClose();
    } catch (err) {
      console.error("Lỗi tạo đơn hàng:", err);
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      alert(serverMsg ? `Lỗi: ${serverMsg}` : 'Lỗi khi tạo đơn hàng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
      >
        <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
          
          {/* HEADER MODAL */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-800">Tạo Đơn Hàng Mới</h2>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* MÃ ĐƠN, SÀN & TRẠNG THÁI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-gray-700">Mã Đơn <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required 
                  value={formData.id} 
                  onChange={e => setFormData({...formData, id: e.target.value})} 
                  placeholder="VD: SPX123456"
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs sm:text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Sàn TMĐT</label>
                <select 
                  value={formData.platform} 
                  onChange={e => setFormData({...formData, platform: e.target.value})} 
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs sm:text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Shopee">Shopee</option>
                  <option value="TikTok Shop">TikTok Shop</option>
                  <option value="Lazada">Lazada</option>
                  <option value="Bán Ngoài">Bán Ngoài / Direct</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Trạng Thái</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value})} 
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs sm:text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white"
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

            {/* CHỌN SẢN PHẨM TỪ DANH MỤC */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">Chọn Sản Phẩm <span className="text-red-500">*</span></label>
                <button 
                  type="button" 
                  onClick={() => setIsAddProductOpen(true)}
                  className="text-[11px] text-blue-600 font-semibold flex items-center gap-0.5 hover:underline"
                >
                  <Plus size={12} /> Thêm SP Mới
                </button>
              </div>
              <select 
                value={formData.productId || ''} 
                onChange={handleSelectProduct}
                required
                className="w-full border border-gray-300 p-2 rounded-lg text-xs sm:text-sm bg-blue-50/50 font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Chọn Sản Phẩm --</option>
                {productsList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ({Number(p.price).toLocaleString('vi-VN')} đ)
                  </option>
                ))}
              </select>
            </div>

            {/* CỤM ĐIỀN GIÁ GỐC, GIÁ BÁN, SỐ LƯỢNG & TỔNG TIỀN */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div>
                <label className="text-[11px] font-semibold text-gray-600">Giá Gốc (đ)</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.productPrice} 
                  onChange={e => handleProductPriceChange(e.target.value)} 
                  className="w-full border border-gray-300 bg-white p-1.5 rounded-lg text-xs mt-1 font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-blue-700">Giá Bán (đ)</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.sellingPrice} 
                  onChange={e => setFormData({...formData, sellingPrice: e.target.value})} 
                  placeholder="0"
                  className="w-full border border-blue-400 bg-white p-1.5 rounded-lg text-xs mt-1 font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600">Số Lượng</label>
                <input 
                  type="number" 
                  min="1" 
                  value={formData.quantity} 
                  onChange={e => handleQtyChange(e.target.value)} 
                  className="w-full border border-gray-300 bg-white p-1.5 rounded-lg text-xs mt-1 font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600">Tổng Tiền Gốc (đ)</label>
                <input 
                  type="text" 
                  value={Number(formData.amount || 0).toLocaleString('vi-VN')} 
                  readOnly 
                  className="w-full border border-gray-200 bg-gray-100 p-1.5 rounded-lg text-xs mt-1 font-extrabold text-blue-600 outline-none" 
                />
              </div>
            </div>

            {/* KHÁCH HÀNG & SĐT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Khách Hàng</label>
                <input 
                  type="text" 
                  value={formData.customer} 
                  onChange={e => setFormData({...formData, customer: e.target.value})} 
                  placeholder="Tên khách hàng"
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs sm:text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Số Điện Thoại</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="Số điện thoại"
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs sm:text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>

            {/* NÚT THAO TÁC */}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button 
                type="button" 
                onClick={onClose} 
                disabled={loading}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
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
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <span>Tạo Đơn Hàng</span>
                )}
              </button>
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