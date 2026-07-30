// update 30/07/2026
import React, { useState } from 'react';
import { Plus, Search, RefreshCw, Calendar, Trash2, Edit3, X } from 'lucide-react';
import api from '../services/api';

// Hàm chuẩn hóa ngày an toàn: Chuyển về đúng dạng "YYYY-MM-DD" cho input type="date"
const safeDateFormat = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    return dateVal;
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

export default function OrdersTab({ orders, onOpenCreateModal, onOpenReasonModal, fetchAllData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // State cho Modal Sửa đơn hàng
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // 1. LỌC ĐƠN HÀNG
  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (o.id && o.id.toLowerCase().includes(term)) ||
      (o.customer && o.customer.toLowerCase().includes(term)) ||
      (o.phone && o.phone.toLowerCase().includes(term)) ||
      (o.product && o.product.toLowerCase().includes(term)) ||
      (o.platform && o.platform.toLowerCase().includes(term));

    let matchesStatus = true;
    if (statusFilter === 'SUCCESS') {
      matchesStatus = o.status === 'Đã giao thành công';
    } else if (statusFilter === 'DELIVERING') {
      matchesStatus = o.status === 'Đang giao hàng' || o.status === 'Mới tạo';
    } else if (statusFilter === 'EXCHANGE') {
      matchesStatus = o.status === 'Đơn đổi';
    } else if (statusFilter === 'RETURNED') {
      matchesStatus = o.status === 'Trả hàng/Hoàn tiền' || o.status === 'Giao hàng không thành công';
    }

    let matchesMonth = true;
    if (selectedMonth) {
      const createdDateVal = safeDateFormat(o.createdDate || o.created_date);
      const orderMonth = createdDateVal ? createdDateVal.substring(0, 7) : '';
      matchesMonth = orderMonth === selectedMonth;
    }

    return matchesSearch && matchesStatus && matchesMonth;
  });

  // 2. XỬ LÝ ĐỔI TRẠNG THÁI
  const handleUpdateStatus = async (order, newStatus) => {
    if (
      newStatus === 'Trả hàng/Hoàn tiền' || 
      newStatus === 'Giao hàng không thành công' || 
      newStatus === 'Đơn đổi'
    ) {
      onOpenReasonModal(order, newStatus);
      return;
    }

    try {
      let deliveredDate = safeDateFormat(order.deliveredDate || order.delivered_date) || null;

      if (newStatus === 'Đã giao thành công') {
        deliveredDate = deliveredDate || new Date().toISOString().split('T')[0];
      }

      await api.put(`/orders/${order.id}`, { status: newStatus, deliveredDate });

      if (
        order.status === 'Giao hàng không thành công' || 
        order.status === 'Trả hàng/Hoàn tiền' || 
        order.status === 'Đơn đổi'
      ) {
        try {
          await api.delete(`/returns/by-order/${order.id}`);
        } catch (e) {}
      }
      fetchAllData();
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
      alert('Lỗi cập nhật trạng thái!');
    }
  };

  // 3. CẬP NHẬT NGÀY THÁNG
  const handleUpdateDates = async (id, field, value) => {
    try {
      const formattedValue = safeDateFormat(value) || null;
      const payload = field === 'createdDate' ? { createdDate: formattedValue } : { deliveredDate: formattedValue };
      await api.put(`/orders/${id}`, payload);
      fetchAllData();
    } catch (err) {
      console.error('Lỗi cập nhật ngày:', err);
      alert('Lỗi cập nhật ngày!');
    }
  };

  // 4. CẬP NHẬT ĐƠN GIÁ BÁN TRỰC TIẾP
  const handleUpdateSellingPrice = async (id, newPrice) => {
    try {
      await api.put(`/orders/${id}`, { sellingPrice: Number(newPrice || 0) });
      fetchAllData();
    } catch (err) {
      console.error('Lỗi cập nhật giá bán:', err);
      alert('Lỗi cập nhật giá bán!');
    }
  };

  // 5. MỞ MODAL SỬA
  const handleOpenEditModal = (order) => {
    setEditingOrder(order);
    setEditFormData({ 
      ...order,
      createdDate: safeDateFormat(order.createdDate || order.created_date),
      deliveredDate: safeDateFormat(order.deliveredDate || order.delivered_date)
    });
  };

  // 6. LƯU CHỈNH SỬA TỪ MODAL (Đã làm sạch dữ liệu tránh lỗi 500)
  const handleSaveEdit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        ...editFormData,
        customer: editFormData.customer ? editFormData.customer.trim() : '',
        phone: editFormData.phone ? editFormData.phone.trim() : '',
        product: editFormData.product ? editFormData.product.trim() : '',
        quantity: Number(editFormData.quantity) || 1,
        sellingPrice: Number(editFormData.sellingPrice ?? editFormData.selling_price ?? 0),
        amount: Number(editFormData.amount) || 0,
        createdDate: safeDateFormat(editFormData.createdDate) || null,
        deliveredDate: safeDateFormat(editFormData.deliveredDate) || null
      };

      await api.put(`/orders/${editingOrder.id}`, payload);
      setEditingOrder(null);
      fetchAllData();
    } catch (err) {
      console.error('Lỗi khi lưu chỉnh sửa:', err);
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      alert(serverMsg ? `Lỗi: ${serverMsg}` : 'Lỗi khi lưu chỉnh sửa!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. XỬ LÝ XÓA ĐƠN HÀNG
  const handleDeleteOrder = async (orderId) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đơn hàng ${orderId}?`)) {
      try {
        await api.delete(`/orders/${orderId}`);
        try {
          await api.delete(`/returns/by-order/${orderId}`);
        } catch (e) {}
        fetchAllData();
      } catch (err) {
        console.error('Lỗi khi xóa đơn hàng:', err);
        alert('Lỗi khi xóa đơn hàng!');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER TỔNG CÔNG CỤ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Danh Sách Đơn Bán Hàng</h1>
          <p className="text-xs text-gray-500">Quản lý và cập nhật tiến độ giao hàng toàn hệ thống.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {fetchAllData && (
            <button 
              onClick={fetchAllData} 
              className="p-2 border rounded-lg bg-white hover:bg-gray-50 text-gray-600 shadow-sm shrink-0"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={16} />
            </button>
          )}
          <button 
            onClick={onOpenCreateModal}
            className="flex-1 sm:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 shadow transition"
          >
            <Plus size={16} /> Tạo Đơn Thủ Công
          </button>
        </div>
      </div>

      {/* BỘ LỌC RESPONSIVE */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        {/* Nút lọc trạng thái */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button 
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
              statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất Cả ({orders.length})
          </button>
          <button 
            onClick={() => setStatusFilter('SUCCESS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
              statusFilter === 'SUCCESS' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Thành Công
          </button>
          <button 
            onClick={() => setStatusFilter('DELIVERING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
              statusFilter === 'DELIVERING' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Đang Xử Lý / Vận Chuyển
          </button>
          <button 
            onClick={() => setStatusFilter('EXCHANGE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
              statusFilter === 'EXCHANGE' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Đơn Đổi
          </button>
          <button 
            onClick={() => setStatusFilter('RETURNED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
              statusFilter === 'RETURNED' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Hoàn / Bom
          </button>
        </div>

        {/* Ô Tìm kiếm & Chọn tháng */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5">
            <div className="flex items-center gap-1.5">
              <Calendar size={15} className="text-gray-500 shrink-0" />
              <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Tháng:</span>
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
              />
            </div>
            {selectedMonth && (
              <button 
                onClick={() => setSelectedMonth('')} 
                className="text-[10px] text-red-500 hover:underline font-bold ml-1"
                title="Xem tất cả tháng"
              >
                ✕ Tất cả
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm mã đơn, khách, SĐT..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ==================== 1. GIAO DIỆN CARD DÀNH CHO ĐIỆN THOẠI (HIỆN KHI < md) ==================== */}
      <div className="block md:hidden space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((o) => (
            <div key={o.id} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm space-y-2.5">
              {/* Mã đơn + Sàn + Nút Hành động */}
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-600 text-xs">#{o.id}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded">
                    {o.platform}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenEditModal(o)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Sửa"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button 
                    onClick={() => handleDeleteOrder(o.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Xóa"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Thông tin Khách & Sản phẩm */}
              <div className="text-xs space-y-1">
                <div className="flex justify-between font-semibold text-gray-800">
                  <span>{o.customer}</span>
                  <span className="text-gray-500 font-normal">{o.phone}</span>
                </div>
                <div className="text-gray-600 flex justify-between">
                  <span className="truncate max-w-[200px]">{o.product}</span>
                  <span className="font-semibold text-gray-500">x{o.quantity}</span>
                </div>
              </div>

              {/* Ô Nhập Đơn Giá Bán & Tổng Tiền Gốc */}
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-lg text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 block mb-0.5">Giá Bán (đ):</span>
                  <input 
                    type="number"
                    defaultValue={o.sellingPrice ?? o.selling_price ?? 0}
                    onBlur={(e) => handleUpdateSellingPrice(o.id, e.target.value)}
                    className="w-full border border-blue-300 rounded px-2 py-1 text-xs font-bold text-blue-700 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block mb-0.5">Tổng Tiền Gốc:</span>
                  <div className="font-bold text-gray-800 py-1">
                    {Number(o.amount || 0).toLocaleString()} đ
                  </div>
                </div>
              </div>

              {/* Trạng thái đơn hàng */}
              <div>
                <span className="text-[10px] text-gray-500 block mb-0.5">Trạng Thái:</span>
                <select 
                  value={o.status}
                  onChange={(e) => handleUpdateStatus(o, e.target.value)}
                  className={`w-full border rounded-lg p-2 text-xs font-semibold focus:outline-none ${
                    o.status === 'Đã giao thành công' ? 'bg-green-50 text-green-700 border-green-200' :
                    o.status === 'Đơn đổi' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    o.status === 'Giao hàng không thành công' || o.status === 'Trả hàng/Hoàn tiền' ? 'bg-red-50 text-red-700 border-red-200' :
                    o.status === 'Đã hủy' ? 'bg-gray-100 text-gray-500 border-gray-300' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  <option value="Mới tạo">Mới tạo</option>
                  <option value="Đang giao hàng">Đang giao hàng</option>
                  <option value="Đã giao thành công">Đã giao thành công</option>
                  <option value="Đơn đổi">Đơn đổi</option>
                  <option value="Giao hàng không thành công">Giao hàng không thành công (Bom)</option>
                  <option value="Trả hàng/Hoàn tiền">Trả hàng/Hoàn tiền</option>
                  <option value="Đã hủy">Đã hủy</option>
                </select>
              </div>

              {/* Ngày tạo & Ngày giao */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-gray-400 block">Ngày tạo:</span>
                  <input 
                    type="date" 
                    value={safeDateFormat(o.createdDate || o.created_date)} 
                    onChange={(e) => handleUpdateDates(o.id, 'createdDate', e.target.value)}
                    className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs bg-white"
                  />
                </div>
                <div>
                  <span className="text-gray-400 block">Ngày giao:</span>
                  <input 
                    type="date" 
                    value={safeDateFormat(o.deliveredDate || o.delivered_date)} 
                    onChange={(e) => handleUpdateDates(o.id, 'deliveredDate', e.target.value)}
                    className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-6 rounded-xl border text-center text-gray-400 text-xs italic">
            Không tìm thấy đơn hàng nào trong tháng/bộ lọc đã chọn.
          </div>
        )}
      </div>

      {/* ==================== 2. GIAO DIỆN BẢNG DÀNH CHO MÁY TÍNH (HIỆN KHI >= md) ==================== */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[950px]">
          <thead className="bg-gray-50 border-b text-gray-500 font-medium text-xs">
            <tr>
              <th className="p-4">Mã Đơn / Vận Đơn</th>
              <th className="p-4">Sàn TMĐT</th>
              <th className="p-4">Khách Hàng</th>
              <th className="p-4">Sản Phẩm</th>
              <th className="p-4">Đơn Giá Bán (đ)</th>
              <th className="p-4">Tổng Tiền (Gốc)</th>
              <th className="p-4">Trạng Thái</th>
              <th className="p-4">Ngày Tạo</th>
              <th className="p-4">Ngày Giao</th>
              <th className="p-4 text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-semibold text-blue-600">{o.id}</td>
                  <td className="p-4 font-medium text-gray-600">{o.platform}</td>
                  <td className="p-4">
                    {o.customer}
                    <span className="block text-xs text-gray-400">{o.phone}</span>
                  </td>
                  <td className="p-4">{o.product} <span className="text-gray-400">x{o.quantity}</span></td>
                  
                  {/* Ô NHẬP ĐƠN GIÁ BÁN */}
                  <td className="p-4">
                    <input 
                      type="number"
                      defaultValue={o.sellingPrice ?? o.selling_price ?? 0}
                      onBlur={(e) => handleUpdateSellingPrice(o.id, e.target.value)}
                      className="w-28 border border-blue-300 rounded px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50/30 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </td>

                  <td className="p-4 font-semibold text-gray-700">
                    {Number(o.amount || 0).toLocaleString()} đ
                  </td>

                  <td className="p-4">
                    <select 
                      value={o.status}
                      onChange={(e) => handleUpdateStatus(o, e.target.value)}
                      className={`border rounded p-1.5 text-xs font-semibold focus:outline-none focus:ring-2 ${
                        o.status === 'Đã giao thành công' ? 'bg-green-50 text-green-700 border-green-200' :
                        o.status === 'Đơn đổi' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        o.status === 'Giao hàng không thành công' || o.status === 'Trả hàng/Hoàn tiền' ? 'bg-red-50 text-red-700 border-red-200' :
                        o.status === 'Đã hủy' ? 'bg-gray-100 text-gray-500 border-gray-300' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <option value="Mới tạo">Mới tạo</option>
                      <option value="Đang giao hàng">Đang giao hàng</option>
                      <option value="Đã giao thành công">Đã giao thành công</option>
                      <option value="Đơn đổi">Đơn đổi</option>
                      <option value="Giao hàng không thành công">Giao hàng không thành công (Bom)</option>
                      <option value="Trả hàng/Hoàn tiền">Trả hàng/Hoàn tiền</option>
                      <option value="Đã hủy">Đã hủy</option>
                    </select>
                  </td>

                  <td className="p-4">
                    <input 
                      type="date" 
                      value={safeDateFormat(o.createdDate || o.created_date)} 
                      onChange={(e) => handleUpdateDates(o.id, 'createdDate', e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="date" 
                      value={safeDateFormat(o.deliveredDate || o.delivered_date)} 
                      onChange={(e) => handleUpdateDates(o.id, 'deliveredDate', e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs"
                    />
                  </td>

                  {/* CỘT HÀNH ĐỘNG */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleOpenEditModal(o)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                        title="Chỉnh sửa đơn hàng"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(o.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        title="Xóa đơn hàng"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="text-center py-8 text-gray-400 italic">
                  Không tìm thấy đơn hàng nào trong tháng/bộ lọc đã chọn.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CHỈNH SỬA CHI TIẾT ĐƠN HÀNG */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 sm:p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setEditingOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-base sm:text-lg font-bold mb-4 text-gray-800">
              Sửa Đơn Hàng: <span className="text-blue-600">{editingOrder.id}</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-600">Khách Hàng:</label>
                <input 
                  type="text" 
                  value={editFormData.customer || ''} 
                  onChange={(e) => setEditFormData({ ...editFormData, customer: e.target.value })}
                  className="w-full border p-2 rounded mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-600">Số Điện Thoại:</label>
                <input 
                  type="text" 
                  value={editFormData.phone || ''} 
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full border p-2 rounded mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-600">Sản Phẩm:</label>
                <input 
                  type="text" 
                  value={editFormData.product || ''} 
                  onChange={(e) => setEditFormData({ ...editFormData, product: e.target.value })}
                  className="w-full border p-2 rounded mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-gray-600">Số Lượng:</label>
                  <input 
                    type="number" 
                    value={editFormData.quantity || 1} 
                    onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                    className="w-full border p-2 rounded mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-600">Giá Bán (đ):</label>
                  <input 
                    type="number" 
                    value={editFormData.sellingPrice ?? editFormData.selling_price ?? 0} 
                    onChange={(e) => setEditFormData({ ...editFormData, sellingPrice: e.target.value })}
                    className="w-full border p-2 rounded mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-600">Tổng Tiền Gốc (đ):</label>
                <input 
                  type="number" 
                  value={editFormData.amount || 0} 
                  onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                  className="w-full border p-2 rounded mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setEditingOrder(null)} 
                disabled={isSubmitting}
                className="px-4 py-2 text-xs border rounded hover:bg-gray-100 font-medium"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveEdit} 
                disabled={isSubmitting}
                className="px-4 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:opacity-50"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}