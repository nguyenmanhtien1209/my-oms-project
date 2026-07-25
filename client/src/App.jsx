// test code 06
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, LogOut, User } from 'lucide-react';

import Sidebar from './components/Sidebar';

import DashboardTab from './components/DashboardTab';
import OrdersTab from './components/OrdersTab';
import ReturnsTab from './components/ReturnsTab';
import ProductsTab from './components/ProductsTab';
import LoginForm from './components/LoginForm';
import api from './services/api';
import CreateOrderModal from './components/modals/CreateOrderModal';
import ReturnReasonModal from './components/modals/ReturnReasonModal';
import ReturnReceiptModal from './components/modals/ReturnReceiptModal';
import AddProductModal from './components/modals/AddProductModal';

import { getLocalDateString } from './utils/dateUtils';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://116.118.6.150:5000/api';

export default function App() {
  // Trạng thái Người dùng Đăng nhập (Lấy từ localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('oms_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);

  // States đơn hoàn
  const [returnCodeInput, setReturnCodeInput] = useState('');
  const [returnReason, setReturnReason] = useState('Khách đổi ý / Không vừa');
  const [videoProof, setVideoProof] = useState('');
  const [receivedDateInput, setReceivedDateInput] = useState(getLocalDateString());

  // Hàm Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('oms_user');
    setCurrentUser(null);
  };

  // Tải danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/products`);
      setProducts(res.data);
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err);
    }
  };

  // Tải toàn bộ dữ liệu từ SQL (Chỉ gọi khi đã đăng nhập)
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ordersRes, returnsRes, productsRes] = await Promise.all([
        axios.get(`${API_BASE}/orders`),
        axios.get(`${API_BASE}/returns`),
        axios.get(`${API_BASE}/products`)
      ]);
      setOrders(ordersRes.data);
      setReturns(returnsRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (currentUser) {
      fetchAllData(); 
    }
  }, [currentUser]);

  // Xử lý Thêm đơn mới
  const handleCreateOrder = async (orderData) => {
    const finalOrderId = orderData.id.trim() || `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    try {
      await axios.post(`${API_BASE}/orders`, { ...orderData, id: finalOrderId });
      setIsOrderModalOpen(false);
      fetchAllData();
    } catch (err) {
      alert('Lỗi tạo đơn!');
    }
  };

  // Xử lý Xóa đơn hàng
  const handleDeleteOrder = async (orderId) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đơn hàng ${orderId}?`)) {
      try {
        await axios.delete(`${API_BASE}/orders/${orderId}`);
        // Đồng thời xóa đơn hoàn liên quan nếu có
        try {
          await axios.delete(`${API_BASE}/returns/by-order/${orderId}`);
        } catch (e) {
          // Bỏ qua nếu không có đơn hoàn tương ứng
        }
        fetchAllData();
      } catch (err) {
        console.error("Lỗi xóa đơn hàng:", err);
        alert('Lỗi khi xóa đơn hàng!');
      }
    }
  };

  // Mở modal chọn lý do hoàn
  const handleOpenReasonModal = (order, targetStatus) => {
    setSelectedOrder({ ...order, targetStatus });
    setReturnCodeInput(`RET-${order.id}`);
    setIsReasonModalOpen(true);
  };

  // Xử lý Chuyển đơn sang Hoàn/Bom (LUÔN LẤY GIÁ GỐC AMOUNT)
  const handleConfirmReturn = async () => {
    if (!selectedOrder) return;
    try {
      const today = getLocalDateString();
      const statusToUpdate = selectedOrder.targetStatus || 'Trả hàng/Hoàn tiền';

      // 1. Cập nhật trạng thái đơn hàng trong bảng Orders
      await axios.put(`${API_BASE}/orders/${selectedOrder.id}`, { status: statusToUpdate });

      const finalReturnCode = returnCodeInput.trim() || `RET-${Math.floor(10000 + Math.random() * 90000)}`;

      // 2. Luôn lấy Giá gốc (amount) làm refundAmount
      const finalRefundAmount = Number(selectedOrder.amount || 0);

      // 3. Lưu vào bảng Returns
      await axios.post(`${API_BASE}/returns`, {
        id: `RET-${Math.floor(1000 + Math.random() * 9000)}`,
        returnCode: finalReturnCode,
        orderId: selectedOrder.id,
        platform: selectedOrder.platform,
        customer: selectedOrder.customer,
        product: selectedOrder.product,
        reason: returnReason,
        refundAmount: finalRefundAmount, // Số tiền hoàn = Giá gốc
        status: 'PENDING',
        note: statusToUpdate === 'Giao hàng không thành công' ? 'Đơn giao thất bại (Bom)' : '',
        returnDate: today
      });

      setIsReasonModalOpen(false);
      setSelectedOrder(null);
      setReturnCodeInput('');
      fetchAllData();
    } catch (err) {
      console.error("Lỗi chuyển đơn hoàn:", err);
      alert('Lỗi chuyển đơn hoàn!');
    }
  };

  // Cập nhật hàm Xác nhận Nhập kho
  const handleConfirmReturnReceipt = async () => {
    if (!selectedReturn) return;
    try {
      const today = getLocalDateString();
      const finalReceivedDate = receivedDateInput || today;
      const targetId = selectedReturn.returnCode || selectedReturn.return_code || selectedReturn.id;

      await axios.put(`${API_BASE}/returns/${targetId}`, {
        status: 'RECEIVED',
        videoProof: videoProof,
        receivedDate: finalReceivedDate
      });

      setIsReturnModalOpen(false);
      setSelectedReturn(null);
      setVideoProof('');
      setReceivedDateInput('');

      await fetchAllData();
    } catch (err) {
      console.error("Lỗi khi gửi request nhập kho:", err);
      alert("Không thể cập nhật ngày nhập kho!");
    }
  };

  // 1. KIỂM TRA ĐĂNG NHẬP: Nếu chưa đăng nhập thì trả về LoginForm
  if (!currentUser) {
    return <LoginForm onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // 2. NẾU ĐANG TẢI DỮ LIỆU SANG TRANG QUẢN TRỊ
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-lg font-semibold text-gray-600">
          <RefreshCw className="animate-spin text-blue-600" /> Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  // 3. GIAO DIỆN QUẢN TRỊ KHI ĐÃ ĐĂNG NHẬP THÀNH CÔNG
  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* SIDEBAR TÍCH HỢP 4 TAB */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        ordersCount={orders.length} 
        returnsCount={returns.length} 
        productsCount={products.length}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER BẢO MẬT & ĐĂNG XUẤT */}
        <header className="bg-white border-b border-gray-200 px-8 py-3.5 flex justify-between items-center shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Hệ thống quản lý đơn hàng
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
              <User size={15} className="text-blue-600" />
              <span>Xin chào, <strong className="text-gray-900">{currentUser.name || currentUser.username}</strong></span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 flex items-center gap-1.5 transition shadow-sm"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut size={14} /> Đăng xuất
            </button>
          </div>
        </header>

        {/* NỘI DUNG TABS */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && <DashboardTab orders={orders} returns={returns} setActiveTab={setActiveTab} />}
          
          {activeTab === 'orders' && (
            <OrdersTab 
              orders={orders} 
              onOpenCreateModal={() => setIsOrderModalOpen(true)} 
              onOpenReasonModal={handleOpenReasonModal}
              fetchAllData={fetchAllData} 
              onDeleteOrder={handleDeleteOrder}
            />
          )}
          
          {activeTab === 'returns' && (
            <ReturnsTab 
              returns={returns} 
              onOpenReceiptModal={(ret) => {
                setSelectedReturn(ret);
                setReceivedDateInput(getLocalDateString());
                setIsReturnModalOpen(true);
              }} 
            />
          )}

          {activeTab === 'products' && (
            <ProductsTab 
              products={products} 
              fetchProducts={fetchProducts} 
              setIsAddProductOpen={setIsAddProductOpen}
            />
          )}
        </div>
      </main>

      {/* MODALS */}
      <CreateOrderModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
        onCreateOrder={handleCreateOrder} 
        fetchAllData={fetchAllData}
      />

      <ReturnReasonModal 
        isOpen={isReasonModalOpen} 
        onClose={() => setIsReasonModalOpen(false)} 
        selectedOrder={selectedOrder} 
        returnCodeInput={returnCodeInput} 
        setReturnCodeInput={setReturnCodeInput} 
        returnReason={returnReason} 
        setReturnReason={setReturnReason} 
        onConfirm={handleConfirmReturn} 
      />

      <ReturnReceiptModal 
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        selectedReturn={selectedReturn}
        receivedDateInput={receivedDateInput}
        setReceivedDateInput={setReceivedDateInput}
        videoProof={videoProof}
        setVideoProof={setVideoProof}
        onConfirm={handleConfirmReturnReceipt}
      />

      <AddProductModal 
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onProductAdded={fetchProducts}
      />
    </div>
  );
}