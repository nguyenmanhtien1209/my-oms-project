import React, { useState, useEffect } from 'react';
import { CheckCircle, FileVideo, Calendar, Search, RefreshCw } from 'lucide-react';

export default function ReturnsTab({ returns = [], onOpenReceiptModal, fetchAllData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Mặc định chọn tháng hiện tại (Format: YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Tự động tải lại dữ liệu từ Server mỗi khi chuyển sang Tab này
  useEffect(() => {
    if (typeof fetchAllData === 'function') {
      fetchAllData();
    }
  }, []);

  // Hàm chuyển đổi các kiểu ngày khác nhau thành YYYY-MM an toàn
  const parseYearMonth = (dateStr) => {
    if (!dateStr) return '';
    const str = String(dateStr).trim();
    if (str.includes('T')) return str.split('T')[0].substring(0, 7); // Dạng ISO
    if (str.includes('-')) {
      const parts = str.split('-');
      if (parts.length >= 2) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        return `${y}-${m}`;
      }
    }
    return str.substring(0, 7);
  };

  // Lọc kết hợp Bộ lọc Trạng thái kho, Lọc Tháng & Tìm kiếm
  const filteredReturns = returns.filter((r) => {
    // 1. Lọc từ khóa
    const term = searchTerm.toLowerCase();
    const returnCode = (r.returnCode || r.return_code || r.id || '').toLowerCase();
    const orderId = (r.orderId || r.order_id || '').toLowerCase();
    const customer = (r.customer || '').toLowerCase();
    const product = (r.product || '').toLowerCase();
    const reason = (r.reason || '').toLowerCase();

    const matchesSearch =
      returnCode.includes(term) ||
      orderId.includes(term) ||
      customer.includes(term) ||
      product.includes(term) ||
      reason.includes(term);

    // 2. Lọc trạng thái
    let matchesStatus = true;
    if (statusFilter === 'PENDING') matchesStatus = r.status === 'PENDING';
    if (statusFilter === 'RECEIVED') matchesStatus = r.status === 'RECEIVED';

    // 3. Lọc theo tháng (Chuẩn hóa định dạng trước khi so sánh)
    let matchesMonth = true;
    if (selectedMonth) {
      const targetDate = r.returnDate || r.return_date || r.receivedDate || r.received_date || '';
      const returnMonth = parseYearMonth(targetDate);
      matchesMonth = returnMonth === selectedMonth;
    }

    return matchesSearch && matchesStatus && matchesMonth;
  });

  return (
    <div className="space-y-4">
      {/* HEADER + NÚT LÀM MỚI */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trợ Lý Quản Lý Đơn Hoàn & Bom Hàng</h1>
          <p className="text-xs text-gray-500">Kiểm soát tiến độ nhận lại hàng về kho và xác minh video đối soát.</p>
        </div>
        {typeof fetchAllData === 'function' && (
          <button 
            onClick={fetchAllData}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
          >
            <RefreshCw size={14} className="text-blue-600" /> Đồng bộ dữ liệu
          </button>
        )}
      </div>

      {/* THANH CÔNG CỤ */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        
        {/* Nút lọc trạng thái */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button 
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất Cả ({returns.length})
          </button>
          <button 
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Chờ Nhập Kho ({returns.filter(r => r.status === 'PENDING').length})
          </button>
          <button 
            onClick={() => setStatusFilter('RECEIVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'RECEIVED' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Đã Nhập Kho ({returns.filter(r => r.status === 'RECEIVED').length})
          </button>
        </div>

        {/* Lọc Tháng & Ô Tìm kiếm */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Ô Chọn Tháng */}
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
                title="Xem tất cả các tháng"
              >
                ✕ Tất cả
              </button>
            )}
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm mã vận đơn, mã đơn gốc..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

      </div>

      {/* BẢNG DANH SÁCH ĐƠN HOÀN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500 font-medium">
            <tr>
              <th className="p-4">Mã Vận Đơn Hoàn</th>
              <th className="p-4">Mã Đơn Bán (Gốc)</th>
              <th className="p-4">Sản Phẩm</th>
              <th className="p-4">Lý Do Hoàn / Bom</th>
              <th className="p-4">Số Tiền Hoàn</th>
              <th className="p-4">Trạng Thái Kho</th>
              <th className="p-4">Ngày Nhập Kho</th>
              <th className="p-4">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReturns.length > 0 ? (
              filteredReturns.map((r) => {
                const displayReceivedDate = r.receivedDate || r.received_date;
                const refundVal = Number(r.refundAmount ?? r.refund_amount ?? 0);

                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-bold text-red-600">{r.returnCode || r.return_code || r.id}</td>
                    <td className="p-4 text-blue-600 font-medium">{r.orderId || r.order_id}</td>
                    <td className="p-4">{r.product}</td>
                    <td className="p-4">
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 text-xs inline-block">
                        {r.reason}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-red-600">
                      {refundVal.toLocaleString()} đ
                    </td>
                    <td className="p-4">
                      {r.status === 'PENDING' ? (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-medium">Chờ Nhập Kho</span>
                      ) : (
                        <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">Đã Nhập Kho</span>
                      )}
                    </td>

                    {/* HIỂN THỊ NGÀY NHẬP KHO */}
                    <td className="p-4 font-medium text-gray-600">
                      {displayReceivedDate ? (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded w-fit">
                          <Calendar size={12} /> {String(displayReceivedDate).split('T')[0]}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Chưa nhập</span>
                      )}
                    </td>

                    <td className="p-4">
                      {r.status === 'PENDING' ? (
                        <button 
                          onClick={() => onOpenReceiptModal(r)}
                          className="bg-slate-800 hover:bg-black text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle size={14} /> Xác Nhận Nhận Hàng
                        </button>
                      ) : (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <FileVideo size={14} className="text-blue-500" /> {r.videoProof || r.video_proof ? 'Đã lưu video' : 'Không video'}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-400 italic">
                  Không tìm thấy đơn hoàn nào trong tháng/bộ lọc đã chọn. 
                  {selectedMonth && (
                    <button 
                      onClick={() => setSelectedMonth('')} 
                      className="ml-2 text-blue-600 underline font-semibold cursor-pointer"
                    >
                      Bấm để xem tất cả tháng
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}