import React, { useState } from 'react';
import { Plus, Search, RefreshCw, Calendar, Trash2, Edit3, X } from 'lucide-react';
import api from '../services/api';

export default function OrdersTab({ orders, onOpenCreateModal, onOpenReasonModal, fetchAllData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // State cho Modal Sửa đơn hàng
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({});

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
      const orderMonth = o.createdDate ? String(o.createdDate).substring(0, 7) : '';
      matchesMonth = orderMonth === selectedMonth;
    }

    return matchesSearch && matchesStatus && matchesMonth;
  });

  // 2. XỬ LÝ ĐỔI TRẠNG THÁI (ĐÃ FIX LỖI MYSQL STRICT MODE)
  const handleUpdateStatus = async (order, newStatus) => {
    // Nếu chọn Trả hàng, Bom HOẶC Đơn đổi -> Kích hoạt Modal để đưa đơn sang bảng Hoàn/Bom
    if (
      newStatus === 'Trả hàng/Hoàn tiền' || 
      newStatus === 'Giao hàng không thành công' || 
      newStatus === 'Đơn đổi'
    ) {
      onOpenReasonModal(order, newStatus);
      return;
    }

    try {
      // Chuẩn hóa deliveredDate: truyền null nếu không có ngày (tránh undefined gây lỗi 500)
      let deliveredDate = order.deliveredDate || order.delivered_date || null;

      if (newStatus === 'Đã giao thành công') {
        deliveredDate = deliveredDate || new Date().toISOString().split('T')[0];
      }

      await api.put(`/orders/${order.id}`, { status: newStatus, deliveredDate });

      // Nếu chuyển từ Hoàn/Bom/Đổi về trạng thái thường -> Xóa thông tin đơn hoàn
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
      alert('Lỗi cập nhật trạng thái!');
    }
  };

  // 3. CẬP NHẬT NGÀY THÁNG (ĐÃ TỐI ƯU TRÁNH LỖI ĐỊNH DẠNG NGÀY)
  const handleUpdateDates = async (id, field, value) => {
    try {
      const formattedValue = value ? value : null;
      const payload = field === 'createdDate' ? { createdDate: formattedValue } : { deliveredDate: formattedValue };
      await api.put(`/orders/${id}`, payload);
      fetchAllData();
    } catch (err) {
      alert('Lỗi cập nhật ngày!');
    }
  };

  // 4. CẬP NHẬT ĐƠN GIÁ BÁN TRỰC TIẾP TRÊN BẢNG
  const handleUpdateSellingPrice = async (id, newPrice) => {
    try {
      await api.put(`/orders/${id}`, { sellingPrice: Number(newPrice || 0) });
      fetchAllData();
    } catch (err) {
      alert('Lỗi cập nhật giá bán!');
    }
  };

  // 5. MỞ MODAL SỬA
  const handleOpenEditModal = (order) => {
    setEditingOrder(order);
    setEditFormData({ ...order });
  };

  // 6. LƯU CHỈNH SỬA TỪ MODAL
  const handleSaveEdit = async () => {
    try {
      await api.put(`/orders/${editingOrder.id}`, editFormData);
      setEditingOrder(null);
      fetchAllData();
    } catch (err) {
      alert('Lỗi khi lưu chỉnh sửa!');
    }
  };

  // 7. XỬ LÝ XÓA ĐƠN HÀNG
  const handleDeleteOrder = async (orderId) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đơn hàng ${orderId}?`)) {
      try {
        await api.delete(`/orders/${orderId}`);
        // Đồng thời xóa đơn hoàn liên quan nếu có
        try {
          await api.delete(`/returns/by-order/${orderId}`);
        } catch (e) {}
        fetchAllData();
      } catch (err) {
        alert('Lỗi khi xóa đơn hàng!');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER TỔNG CÔNG CỤ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Danh Sách Đơn Bán Hàng</h1>
          <p className="text-xs text-gray-500">Quản lý và cập nhật tiến độ giao hàng toàn hệ thống.</p>
        </div>
        <div className="flex items-center gap-2">
          {fetchAllData && (
            <button 
              onClick={fetchAllData} 
              className="p-2 border rounded-lg bg-white hover:bg-gray-50 text-gray-600 shadow-sm"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={16} />
            </button>
          )}
          <button 
            onClick={onOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow"
          >
            <Plus size={18} /> Tạo Đơn Thủ Công
          </button>
        </div>
      </div>

      {/* BỘ LỌC */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button 
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất Cả ({orders.length})
          </button>
          <button 
            onClick={() => setStatusFilter('SUCCESS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'SUCCESS' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Thành Công
          </button>
          <button 
            onClick={() => setStatusFilter('DELIVERING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'DELIVERING' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Đang Xử Lý / Vận Chuyển
          </button>
          <button 
            onClick={() => setStatusFilter('EXCHANGE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'EXCHANGE' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Đơn Đổi
          </button>
          <button 
            onClick={() => setStatusFilter('RETURNED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'RETURNED' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Hoàn / Bom
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1">
            <Calendar size={15} className="text-gray-500" />
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Tháng:</span>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            />
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
              placeholder="Tìm theo mã đơn, khách, SĐT..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU ĐƠN HÀNG */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500 font-medium text-xs">
            <tr>
              <th className="p-4">Mã Đơn / Mã Vận Đơn</th>
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
                      value={o.createdDate || o.created_date || ''} 
                      onChange={(e) => handleUpdateDates(o.id, 'createdDate', e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="date" 
                      value={o.deliveredDate || o.delivered_date || ''} 
                      onChange={(e) => handleUpdateDates(o.id, 'deliveredDate', e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs"
                    />
                  </td>

                  {/* CỘT HÀNH ĐỘNG (SỬA & XÓA) */}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <button 
              onClick={() => setEditingOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold mb-4 text-gray-800">Sửa Đơn Hàng: {editingOrder.id}</h2>

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
                    onChange={(e) => setEditFormData({ ...editFormData, quantity: Number(e.target.value) })}
                    className="w-full border p-2 rounded mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-600">Giá Bán (đ):</label>
                  <input 
                    type="number" 
                    value={editFormData.sellingPrice ?? editFormData.selling_price ?? 0} 
                    onChange={(e) => setEditFormData({ ...editFormData, sellingPrice: Number(e.target.value) })}
                    className="w-full border p-2 rounded mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-600">Tổng Tiền Gốc (đ):</label>
                <input 
                  type="number" 
                  value={editFormData.amount || 0} 
                  onChange={(e) => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
                  className="w-full border p-2 rounded mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setEditingOrder(null)} 
                className="px-4 py-2 text-xs border rounded hover:bg-gray-100 font-medium"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveEdit} 
                className="px-4 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}