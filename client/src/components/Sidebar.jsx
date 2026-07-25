import React from 'react';
import { LayoutDashboard, ShoppingBag, RotateCcw, Package } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, ordersCount, returnsCount, productsCount }) {
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
    <div className="w-64 bg-[#0b1329] text-gray-300 h-screen p-4 flex flex-col font-sans">
      {/* LOGO */}
      <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-gray-800">
        <ShoppingBag className="text-blue-500 w-7 h-7" />
        <h1 className="text-xl font-extrabold text-white tracking-wide">QL Đơn Hàng</h1>
      </div>

      {/* MENU NAVIGATION */}
      <nav className="space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  ({item.badge})
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}