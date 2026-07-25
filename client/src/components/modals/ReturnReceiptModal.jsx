import React from 'react';
import { getLocalDateString } from '../../utils/dateUtils';

export default function ReturnReceiptModal({ 
  isOpen, 
  onClose, 
  selectedReturn, 
  receivedDateInput, 
  setReceivedDateInput, 
  videoProof, 
  setVideoProof, 
  onConfirm 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
        <h2 className="text-lg font-bold mb-2">Kiểm Kho Đơn Hoàn</h2>
        <p className="text-xs text-gray-500 mb-4">
          Xác nhận gói hàng <span className="font-semibold text-red-600">{selectedReturn?.returnCode || selectedReturn?.return_code || selectedReturn?.id}</span> đã về tới kho.
        </p>
        
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-600">Ngày Nhập Kho thực tế:</label>
          <input 
            type="date" 
            value={receivedDateInput || getLocalDateString()} 
            onChange={e => setReceivedDateInput(e.target.value)} 
            className="w-full border p-2 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600">Link Video Mở Hàng (nếu có):</label>
          <input 
            type="text" 
            placeholder="https://..." 
            value={videoProof} 
            onChange={e => setVideoProof(e.target.value)} 
            className="w-full border p-2 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs border rounded hover:bg-gray-100">Hủy</button>
          <button onClick={onConfirm} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700">Đã Nhập Kho</button>
        </div>
      </div>
    </div>
  );
}