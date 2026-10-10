import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Bell, UtensilsCrossed, LayoutDashboard, Compass, Clock, LogOut } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openNotifications: () => void;
  unreadCount: number;
  openCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openNotifications,
  unreadCount,
  openCart,
}) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  const isOwner = user?.role === 'owner' || user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element Brand Zone */}
          <button
            onClick={() => setCurrentTab(isOwner ? 'owner_overview' : 'student_home')}
            className="flex items-center gap-2.5 text-left text-stone-900 group whitespace-nowrap shrink-0 focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <UtensilsCrossed className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-stone-900 block leading-tight">
                CanteenIQ AI
              </span>
              <span className="text-[10px] text-stone-500 font-medium tracking-wide uppercase block">
                Smart Food · Smarter Campus
              </span>
            </div>
          </button>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            {!isOwner ? (
              <>
                <button
                  onClick={() => setCurrentTab('student_home')}
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 py-1 ${
                    currentTab === 'student_home' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800' : ''
                  }`}
                >
                  Campus Canteens
                </button>
                <button
                  onClick={() => setCurrentTab('menu')}
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 py-1 ${
                    currentTab === 'menu' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800' : ''
                  }`}
                >
                  Order Food
                </button>
                <button
                  onClick={() => setCurrentTab('break_planner')}
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
                    currentTab === 'break_planner' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800' : ''
                  }`}
                >
                  <Clock className="w-4 h-4 text-emerald-700" />
                  Break-Time Planner
                </button>
                <button
                  onClick={() => setCurrentTab('my_orders')}
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 py-1 ${
                    currentTab === 'my_orders' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800' : ''
                  }`}
                >
                  My Orders
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentTab('owner_overview')}
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
                    currentTab === 'owner_overview' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800' : ''
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                  Live Kitchen Console
                </button>
                <button
                  onClick={() => setCurrentTab('owner_inventory')}
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 py-1 ${
                    currentTab === 'owner_inventory' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800' : ''
                  }`}
                >
                  Menu & Stock Inventory
                </button>
                <button
                  onClick={() => setCurrentTab('owner_qr')}
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 py-1 ${
                    currentTab === 'owner_qr' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800' : ''
                  }`}
                >
                  QR Pickup Verification
                </button>
                <button
                  onClick={() => setCurrentTab('owner_analytics')}
                  className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 py-1 ${
                    currentTab === 'owner_analytics' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800' : ''
                  }`}
                >
                  Sales & Reports
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Primary action & controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notifications Button */}
            <button
              onClick={openNotifications}
              className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors focus:outline-none"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Cart Button (For Students) */}
            {!isOwner && (
              <button
                onClick={openCart}
                className="relative flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-200" />
                <span className="hidden sm:inline">My Cart</span>
                {itemCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile Pill & Role Badge */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-stone-200">
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-bold text-stone-800 leading-tight">
                  {user?.name || 'Guest'}
                </span>
                <span className="block text-[11px] text-stone-500 font-medium">
                  {user?.role === 'owner'
                    ? user.canteenId === 'canteen_a'
                      ? 'Harvest Grill Owner'
                      : 'Banyan Court Owner'
                    : user?.role === 'admin'
                    ? 'Campus Director'
                    : `Student · ${user?.studentId || 'ID#402'}`}
                </span>
              </div>
              <button
                onClick={logout}
                title="Switch Profile / Logout"
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
