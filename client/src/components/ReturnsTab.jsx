import React, { useState, useEffect } from 'react';
import { CheckCircle, FileVideo, Calendar, Search, RefreshCw, RotateCcw } from 'lucide-react';

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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* HEADER + NÚT LÀM MỚI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
            <RotateCcw size={22} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">Quản Lý Đơn Hoàn & Bom Hàng</h1>
            <p className="text-xs text-gray-500">Kiểm soát tiến độ nhận lại hàng về kho và xác minh video đối soát</p>
          </div>
        </div>

        {typeof fetchAllData === 'function' && (
          <button 
            onClick={fetchAllData}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition active:scale-95"
          >
            <RefreshCw size={14} className="text-blue-600" /> Đồng bộ dữ liệu
          </button>
        )}
      </div>

      {/* THANH CÔNG CỤ (Nút Lọc Trạng Thái + Ô Tháng + Ô Tìm Kiếm) */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        
        {/* Nút lọc trạng thái */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
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
          <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 sm:py-1">
            <div className="flex items-center gap-1.5">
              <Calendar size={15} className="text-gray-500" />
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
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

      </div>

      {/* GIAO DIỆN THẺ MOBILE (< 768px) */}
      <div className="block md:hidden space-y-3">
        {filteredReturns.length > 0 ? (
          filteredReturns.map((r) => {
            const displayReceivedDate = r.receivedDate || r.received_date;
            const refundVal = Number(r.refundAmount ?? r.refund_amount ?? 0);
            const returnCode = r.returnCode || r.return_code || r.id;
            const orderId = r.orderId || r.order_id;

            return (
              <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                {/* Dòng 1: Mã Vận Đơn & Trạng Thái Kho (Đã khắc phục lỗi rớt dòng) */}
                <div className="flex justify-between items-start gap-2 border-b border-gray-100 pb-2.5">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Mã Hoàn / Mã Đơn Gốc</span>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="font-bold text-red-600 text-sm break-all">{returnCode}</span>
                      {orderId && <span className="text-xs text-blue-600 font-semibold break-all">({orderId})</span>}
                    </div>
                  </div>

                  {/* Badge Trạng Thái Kho (Cố định 1 dòng) */}
                  <div className="flex-shrink-0 pt-0.5">
                    {r.status === 'PENDING' ? (
                      <span className="bg-amber-100 text-amber-800 text-[11px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap inline-block shadow-sm">
                        Chờ Nhập Kho
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-800 text-[11px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap inline-block shadow-sm">
                        Đã Nhập Kho
                      </span>
                    )}
                  </div>
                </div>

                {/* Dòng 2: Sản phẩm, Lý do, Tiền hoàn & Ngày nhập kho */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-gray-800">
                    <span className="text-gray-500">Sản phẩm:</span>
                    <span className="font-bold">{r.product || 'N/A'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Lý do:</span>
                    <span className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 text-[11px] font-semibold max-w-[180px] truncate">
                      {r.reason || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Tiền hoàn:</span>
                    <span className="font-extrabold text-red-600 text-sm">
                      {refundVal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {displayReceivedDate && (
                    <div className="flex justify-between items-center text-gray-500 pt-1">
                      <span>Ngày nhập kho:</span>
                      <span className="flex items-center gap-1 text-[11px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded font-medium">
                        <Calendar size={12} /> {String(displayReceivedDate).split('T')[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Dòng 3: Nút Hành động */}
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  {r.status === 'PENDING' ? (
                    <button 
                      onClick={() => onOpenReceiptModal(r)}
                      className="w-full bg-slate-800 hover:bg-black active:bg-slate-900 text-white text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm font-semibold transition"
                    >
                      <CheckCircle size={15} /> Xác Nhận Nhận Hàng
                    </button>
                  ) : (
                    <div className="w-full bg-gray-50 p-2 rounded-lg text-xs text-gray-600 flex items-center justify-center gap-1.5 border border-gray-200/60">
                      <FileVideo size={15} className="text-blue-500" />
                      <span>{r.videoProof || r.video_proof ? 'Đã lưu video đối soát' : 'Không có video đối soát'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-400 text-xs italic space-y-2">
            <div>Không tìm thấy đơn hoàn nào trong tháng/bộ lọc đã chọn.</div>
            {selectedMonth && (
              <button 
                onClick={() => setSelectedMonth('')} 
                className="text-blue-600 underline font-semibold cursor-pointer block mx-auto"
              >
                Bấm để xem tất cả tháng
              </button>
            )}
          </div>
        )}
      </div>

      {/* GIAO DIỆN BẢNG DESKTOP (>= 768px) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 uppercase font-semibold">
            <tr>
              <th className="p-4">Mã Vận Đơn Hoàn</th>
              <th className="p-4">Mã Đơn Bán (Gốc)</th>
              <th className="p-4">Sản Phẩm</th>
              <th className="p-4">Lý Do Hoàn / Bom</th>
              <th className="p-4">Số Tiền Hoàn</th>
              <th className="p-4">Trạng Thái Kho</th>
              <th className="p-4">Ngày Nhập Kho</th>
              <th className="p-4 text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReturns.length > 0 ? (
              filteredReturns.map((r) => {
                const displayReceivedDate = r.receivedDate || r.received_date;
                const refundVal = Number(r.refundAmount ?? r.refund_amount ?? 0);

                return (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4 font-bold text-red-600">{r.returnCode || r.return_code || r.id}</td>
                    <td className="p-4 text-blue-600 font-medium">{r.orderId || r.order_id}</td>
                    <td className="p-4 font-semibold text-gray-800">{r.product}</td>
                    <td className="p-4">
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 text-xs inline-block">
                        {r.reason}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-red-600">
                      {refundVal.toLocaleString('vi-VN')} đ
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

                    <td className="p-4 text-center">
                      {r.status === 'PENDING' ? (
                        <button 
                          onClick={() => onOpenReceiptModal(r)}
                          className="bg-slate-800 hover:bg-black text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 shadow-sm mx-auto"
                        >
                          <CheckCircle size={14} /> Xác Nhận Nhận Hàng
                        </button>
                      ) : (
                        <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
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