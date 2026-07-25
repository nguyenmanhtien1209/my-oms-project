import React from 'react';

export default function ReturnReasonModal({ 
  isOpen, 
  onClose, 
  selectedOrder, 
  returnCodeInput, 
  setReturnCodeInput, 
  returnReason, 
  setReturnReason, 
  onConfirm 
}) {
  if (!isOpen || !selectedOrder) return null;

  // TÍNH TIỀN HOÀN: Luôn hiển thị Giá gốc (amount)
  const displayRefundPrice = Number(selectedOrder.amount || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
        <h2 className="text-lg font-bold mb-2">Chuyển Sang Đơn Hoàn / Bom</h2>
        <p className="text-xs text-gray-500 mb-4">
          Đơn hàng <span className="font-semibold text-blue-600">{selectedOrder.id}</span> sẽ được tự động đồng bộ sang Tab Đơn Hoàn & Bom.
        </p>
        
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-600">Mã Vận Đơn Hoàn (Trả hàng):</label>
          <input 
            type="text" 
            placeholder="VD: SPX1234567..." 
            value={returnCodeInput} 
            onChange={e => setReturnCodeInput(e.target.value)} 
            className="w-full border p-2 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-600">Lý do trả hàng/bom:</label>
          <select 
            value={returnReason} 
            onChange={e => setReturnReason(e.target.value)} 
            className="w-full border p-2 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="Khách đổi ý / Không vừa">Khách đổi ý / Không vừa</option>
            <option value="Hàng bị lỗi / Hỏng hóc">Hàng bị lỗi / Hỏng hóc</option>
            <option value="Khách không nghe máy (Bom hàng)">Khách không nghe máy (Bom hàng)</option>
            <option value="Giao 1 Thu 1">Giao 1 Thu 1</option>
            <option value="Giao sai sản phẩm">Giao sai sản phẩm</option>
            <option value="Địa chỉ không tìm thấy">Địa chỉ không tìm thấy</option>
          </select>
        </div>

        {/* HIỂN THỊ SỐ TIỀN HOÀN THEO GIÁ GỐC */}
        <div className="mb-4 bg-red-50 p-2.5 rounded-lg border border-red-200">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-red-700">Số Tiền Hoàn (Giá Gốc):</span>
            <span className="font-extrabold text-red-600 text-sm">
              {displayRefundPrice.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs border rounded hover:bg-gray-100">
            Hủy
          </button>
          <button onClick={onConfirm} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700">
            Xác Nhận Chuyển
          </button>
        </div>
      </div>
    </div>
  );
}