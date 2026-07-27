import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBag, RotateCcw, Package, Menu, X } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, ordersCount, returnsCount, productsCount }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tổng Quan',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'orders',
      label: 'Đơn Bán Hàng',
      icon: ShoppingBag,
      badge: ordersCount
    },
    {
      id: 'returns',
      label: 'Đơn Hoàn & Bom',
      icon: RotateCcw,
      badge: returnsCount
    },
    {
      id: 'products',
      label: 'Sản Phẩm',
      icon: Package,
      badge: productsCount
    }
  ];

  return (
    <>
      {/* 1. THANH HEADER TOP CHO ĐIỆN THOẠI (Chỉ hiển thị trên Mobile < md) */}
      <div className="md:hidden bg-[#0b1329] text-gray-300 px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-gray-800 shadow-md">
        <div className="flex items-center gap-3">
          <ShoppingBag className="text-blue-500 w-6 h-6" />
          <h1 className="text-lg font-extrabold text-white tracking-wide">QL Đơn Hàng</h1>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-lg transition focus:outline-none"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 2. OVERLAY TỐI NỀN KHI MỞ MENU MOBILE */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 3. KHUNG SIDEBAR CHÍNH (Cố định trên Desktop - Dạng Drawer trượt trên Mobile) */}
      <aside
        className={`
          fixed md:static top-0 left-0 bottom-0 z-50
          w-64 bg-[#0b1329] text-gray-300 h-screen p-4 flex flex-col font-sans border-r border-gray-800/50 shadow-2xl md:shadow-none
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* LOGO (Hiện trên Máy tính hoặc khi mở Drawer Mobile) */}
        <div className="flex items-center justify-between px-3 py-4 mb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-blue-500 w-7 h-7" />
            <h1 className="text-xl font-extrabold text-white tracking-wide">QL Đơn Hàng</h1>
          </div>
          {/* Nút đóng nhanh trên Mobile */}
          <button 
            onClick={() => setIsOpen(false)} 
            className="md:hidden p-1 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* MENU NAVIGATION */}
        <nav className="space-y-1.5 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false); // Tự động đóng Menu Drawer khi người dùng bấm chọn trên điện thoại
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30'
                    : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <span>{item.label}</span>
                </div>

                {/* Count Badge */}
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    ({item.badge})
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}