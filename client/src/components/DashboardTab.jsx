import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  ArrowRight,
  PackageCheck,
  Calendar,
  BarChart3
} from 'lucide-react';

export default function DashboardTab({ orders = [], returns = [], setActiveTab }) {
  // =========================================================================
  // XỬ LÝ TÍNH TOÁN BÁO CÁO THEO THÁNG
  // =========================================================================

  // 1. Trích xuất danh sách tháng hiện có từ dữ liệu (định dạng YYYY-MM)
  const availableMonths = useMemo(() => {
    const monthSet = new Set();
    orders.forEach((o) => {
      const dateStr = o.createdDate || o.created_date;
      if (dateStr && dateStr.length >= 7) {
        monthSet.add(dateStr.substring(0, 7));
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [orders]);

  // State chọn tháng cho bộ lọc chi tiết
  const [selectedMonth, setSelectedMonth] = useState('');
  const currentMonthFilter = selectedMonth || (availableMonths[0] || '');

  // 2. Thống kê số liệu chi tiết cho Tháng đang chọn
  const monthlyStats = useMemo(() => {
    if (!currentMonthFilter) {
      return {
        successCount: 0,
        returnCount: 0,
        totalCostSuccess: 0,
        totalSalesSuccess: 0,
        totalCostReturn: 0,
        totalSalesReturn: 0,
      };
    }

    const filteredOrders = orders.filter((o) => {
      const dateStr = o.createdDate || o.created_date;
      return dateStr && dateStr.startsWith(currentMonthFilter);
    });

    let successCount = 0;
    let returnCount = 0;
    let totalCostSuccess = 0;   // Tổng giá gốc đơn thành công
    let totalSalesSuccess = 0;  // Tổng giá bán đơn thành công
    let totalCostReturn = 0;    // Tổng giá gốc đơn hoàn/bom/đổi
    let totalSalesReturn = 0;   // Tổng giá bán đơn hoàn/bom/đổi

    filteredOrders.forEach((o) => {
      const status = (o.status || '').trim();
      const amount = Number(o.amount || 0);
      const sellingPrice = Number(o.sellingPrice ?? o.selling_price ?? 0);
      const quantity = Number(o.quantity || 1);
      
      const totalSelling = sellingPrice > 0 ? sellingPrice * quantity : amount;

      if (status === 'Đã giao thành công' || status === 'Đã giao' || status === 'completed') {
        successCount++;
        totalCostSuccess += amount;
        totalSalesSuccess += totalSelling;
      } 
      else if (
        status === 'Trả hàng/Hoàn tiền' || 
        status === 'Giao hàng không thành công' || 
        status === 'Giao hàng không thành công (Bom)' ||
        status === 'Đã hoàn' ||
        status === 'Bom hàng' ||
        status === 'Đơn đổi'
      ) {
        returnCount++;
        totalCostReturn += amount;
        totalSalesReturn += totalSelling;
      }
    });

    return {
      successCount,
      returnCount,
      totalCostSuccess,
      totalSalesSuccess,
      totalCostReturn,
      totalSalesReturn,
    };
  }, [orders, currentMonthFilter]);

  // 3. Tổng hợp Bảng Báo Cáo tất cả các tháng
  const allMonthsReport = useMemo(() => {
    return availableMonths.map((m) => {
      const monthOrders = orders.filter((o) => {
        const dateStr = o.createdDate || o.created_date;
        return dateStr && dateStr.startsWith(m);
      });

      let successCount = 0;
      let returnCount = 0;
      let costSuccess = 0;
      let salesSuccess = 0;
      let costReturn = 0;
      let salesReturn = 0;

      monthOrders.forEach((o) => {
        const status = (o.status || '').trim();
        const amount = Number(o.amount || 0);
        const sellingPrice = Number(o.sellingPrice ?? o.selling_price ?? 0);
        const quantity = Number(o.quantity || 1);
        const totalSelling = sellingPrice > 0 ? sellingPrice * quantity : amount;

        if (status === 'Đã giao thành công' || status === 'Đã giao' || status === 'completed') {
          successCount++;
          costSuccess += amount;
          salesSuccess += totalSelling;
        } else if (
          status === 'Trả hàng/Hoàn tiền' || 
          status === 'Giao hàng không thành công' || 
          status === 'Giao hàng không thành công (Bom)' ||
          status === 'Đã hoàn' ||
          status === 'Bom hàng' ||
          status === 'Đơn đổi'
        ) {
          returnCount++;
          costReturn += amount;
          salesReturn += totalSelling;
        }
      });

      return {
        month: m,
        successCount,
        returnCount,
        costSuccess,
        salesSuccess,
        costReturn,
        salesReturn,
      };
    });
  }, [orders, availableMonths]);

  // =========================================================================
  // XỬ LÝ CÁC THÔNG SỐ KPI TỔNG CHUNG
  // =========================================================================
  const completedOrders = orders.filter(o => o.status === 'Đã giao thành công' || o.status === 'Đã giao');

  const totalRevenue = completedOrders.reduce((sum, o) => {
    const selling = Number(o.sellingPrice ?? o.selling_price ?? 0);
    const qty = Number(o.quantity || 1);
    return sum + (selling > 0 ? selling * qty : Number(o.amount || 0));
  }, 0);
  
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'Mới tạo' || o.status === 'Đang giao hàng' || o.status === 'Đang xử lý').length;
  const successRate = totalOrdersCount ? ((completedOrders.length / totalOrdersCount) * 100).toFixed(1) : 0;
  
  const allReturnedOrdersCount = orders.filter(o => 
    o.status === 'Trả hàng/Hoàn tiền' || 
    o.status === 'Giao hàng không thành công' || 
    o.status === 'Đơn đổi'
  ).length;

  const pendingReturnsCount = returns.filter(r => r.status === 'PENDING').length;
  const receivedReturnsCount = returns.filter(r => r.status === 'RECEIVED').length;
  const pendingReturnsList = returns.filter(r => r.status === 'PENDING').slice(0, 4);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER TỔNG QUAN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Báo Cáo Tổng Quan Hệ Thống</h1>
          <p className="text-xs text-gray-500 mt-0.5">Theo dõi doanh thu, trạng thái đơn hàng và tiến độ xử lý kho theo thời gian thực.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab && setActiveTab('orders')}
            className="flex-1 sm:flex-none justify-center px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 shadow-sm transition"
          >
            <ShoppingBag size={14} /> <span className="truncate">Xem tất cả đơn bán</span>
          </button>
          <button 
            onClick={() => setActiveTab && setActiveTab('returns')}
            className="flex-1 sm:flex-none justify-center px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-sm transition"
          >
            <RotateCcw size={14} /> <span className="truncate">Xử lý đơn hoàn ({pendingReturnsCount})</span>
          </button>
        </div>
      </div>

      {/* 1. HÀNG THẺ THỐNG KÊ KPI (2 CỘT TÊN MOBILE, 4 CỘT TRÊN DESKTOP) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh Thu Đã Giao</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-green-600 mt-1.5">{totalRevenue.toLocaleString('vi-VN')} đ</h3>
            </div>
            <div className="p-2 sm:p-2.5 bg-green-50 text-green-600 rounded-lg shrink-0">
              <TrendingUp size={20} className="sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-3 flex items-center gap-1">
            <span className="text-green-600 font-semibold">{completedOrders.length}</span> đơn giao thành công
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng Đơn Hàng</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-blue-600 mt-1.5">{totalOrdersCount}</h3>
            </div>
            <div className="p-2 sm:p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <ShoppingBag size={20} className="sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-3">
            Đang xử lý / vận chuyển: <span className="font-semibold text-gray-700">{pendingOrdersCount}</span>
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Tỷ Lệ Giao Thành Công</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-indigo-600 mt-1.5">{successRate}%</h3>
            </div>
            <div className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <CheckCircle2 size={20} className="sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(Number(successRate), 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Chờ Duyệt Kho</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-1.5">{pendingReturnsCount}</h3>
            </div>
            <div className="p-2 sm:p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <AlertTriangle size={20} className="sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-3">
            Đã nhập kho thành công: <span className="font-semibold text-green-600">{receivedReturnsCount}</span>
          </p>
        </div>
      </div>

      {/* 2. KHU VỰC BÁO CÁO CHI TIẾT THEO THÁNG */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3 sm:pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="text-blue-600 shrink-0" size={18} /> Báo Cáo Hiệu Quả Theo Tháng
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">So sánh tổng giá gốc, giá bán giữa đơn giao thành công và đơn hoàn/bom/đổi</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="text-gray-400 shrink-0" size={16} />
            <select
              value={currentMonthFilter}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  Tháng {m.split('-')[1]}/{m.split('-')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2 THẺ TỔNG GIÁ GỐC / GIÁ BÁN TRONG THÁNG */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-800 text-xs sm:text-sm flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> Đơn Giao Thành Công
              </span>
              <span className="bg-emerald-200/80 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs">
                {monthlyStats.successCount} đơn
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60">
              <div>
                <p className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold uppercase">Tổng Giá Gốc</p>
                <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-0.5">
                  {monthlyStats.totalCostSuccess.toLocaleString('vi-VN')} đ
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold uppercase">Tổng Giá Bán</p>
                <p className="text-sm sm:text-base font-extrabold text-emerald-700 mt-0.5">
                  {monthlyStats.totalSalesSuccess.toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>
          </div>

          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-800 text-xs sm:text-sm flex items-center gap-1.5 truncate pr-1">
                <RotateCcw size={16} className="text-rose-600 shrink-0" /> Hoàn / Bom / Đổi
              </span>
              <span className="bg-rose-200/80 text-rose-900 font-bold px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs shrink-0">
                {monthlyStats.returnCount} đơn
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-200/60">
              <div>
                <p className="text-[10px] sm:text-[11px] text-rose-600 font-semibold uppercase">Tổng Giá Gốc Hoàn</p>
                <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-0.5">
                  {monthlyStats.totalCostReturn.toLocaleString('vi-VN')} đ
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] text-rose-600 font-semibold uppercase">Tổng Giá Bán Hoàn</p>
                <p className="text-sm sm:text-base font-extrabold text-rose-700 mt-0.5">
                  {monthlyStats.totalSalesReturn.toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BẢNG TỔNG HỢP CÁC THÁNG (CÓ SCROLL NGANG CHỐNG VỠ TRÊN MOBILE) */}
<div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
  <table className="w-full text-left text-xs border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
                <th className="p-3">Tháng</th>
                <th className="p-3 text-center">Đơn Thành Công</th>
                <th className="p-3 text-right">Giá Gốc Thành Công</th>
                <th className="p-3 text-right">Giá Bán Thành Công</th>
                <th className="p-3 text-center">Đơn Hoàn/Bom/Đổi</th>
                <th className="p-3 text-right">Giá Gốc Hoàn</th>
                <th className="p-3 text-right">Giá Bán Hoàn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allMonthsReport.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-400">
                    Chưa có dữ liệu báo cáo tháng
                  </td>
                </tr>
              ) : (
                allMonthsReport.map((row) => (
                  <tr key={row.month} className="hover:bg-gray-50/80">
                    <td className="p-3 font-bold text-gray-800">
                      Tháng {row.month.split('-')[1]}/{row.month.split('-')[0]}
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-600">
                      {row.successCount}
                    </td>
                    <td className="p-3 text-right font-medium text-gray-700">
                      {row.costSuccess.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {row.salesSuccess.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3 text-center font-bold text-rose-600">
                      {row.returnCount}
                    </td>
                    <td className="p-3 text-right font-medium text-gray-700">
                      {row.costReturn.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3 text-right font-bold text-rose-700">
                      {row.salesReturn.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. KHU VỰC NỘI DUNG PHỤ (TỰ ĐỘNG XẾP DỌC TRÊN MOBILE / 2 CỘT TRÊN PC) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <div className="flex justify-between items-center mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="text-amber-500 shrink-0" size={18} />
              <h3 className="font-bold text-gray-800 text-sm sm:text-base">Đơn Hoàn & Bom Cần Kiểm Kho Gấp</h3>
            </div>
            {setActiveTab && (
              <button 
                onClick={() => setActiveTab('returns')} 
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium shrink-0"
              >
                Xem tất cả ({returns.length}) <ArrowRight size={12} />
              </button>
            )}
          </div>

          {pendingReturnsList.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {pendingReturnsList.map((item) => (
                <div key={item.id} className="py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 px-2 rounded-lg transition gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="font-bold text-red-600 text-xs">#{item.returnCode || item.id}</span>
                      <span className="text-[11px] text-gray-400">| Đơn gốc: {item.orderId}</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">{item.platform}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-700">{item.product} - <span className="text-amber-700 font-normal">{item.reason}</span></p>
                  </div>
                  <div className="flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-0 border-gray-100 pt-1 sm:pt-0">
                    <p className="text-xs font-bold text-gray-800">{Number(item.refundAmount || 0).toLocaleString('vi-VN')} đ</p>
                    <span className="inline-block bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-medium">Chờ Nhập Kho</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <PackageCheck size={36} className="mx-auto mb-2 text-green-500 opacity-60" />
              <p className="text-xs">Tuyệt vời! Không có đơn hoàn nào chờ nhập kho.</p>
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-3 sm:mb-4 pb-2 border-b border-gray-100">
              Phân Bổ Trạng Thái Đơn Bán
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-green-700">Đã giao thành công</span>
                  <span>{completedOrders.length} đơn</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${totalOrdersCount ? (completedOrders.length / totalOrdersCount) * 100 : 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-blue-700">Đang vận chuyển / Mới tạo</span>
                  <span>{pendingOrdersCount} đơn</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${totalOrdersCount ? (pendingOrdersCount / totalOrdersCount) * 100 : 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-red-700">Hoàn tiền / Bom / Đơn đổi</span>
                  <span>{allReturnedOrdersCount} đơn</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${totalOrdersCount ? (allReturnedOrdersCount / totalOrdersCount) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm">
            <h4 className="font-bold text-xs sm:text-sm mb-1.5 text-blue-400">Trợ Lý Quản Lý Bán Hàng</h4>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed mb-3">
              Hệ thống kết nối trực tiếp cơ sở dữ liệu MySQL <span className="text-green-400 font-mono">(oms_db)</span>. Mọi thay đổi trạng thái và ngày nhập kho được đồng bộ tức thì.
            </p>
            <div className="text-[10px] sm:text-[11px] text-slate-400 border-t border-slate-800 pt-2.5">
              Trạng thái máy chủ: <span className="text-green-400 font-medium">Hoạt động (Port 5000)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}