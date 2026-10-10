import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { CanteenComparisonView } from './components/CanteenComparisonView';
import { MenuBrowser } from './components/MenuBrowser';
import { FoodCustomizationModal } from './components/FoodCustomizationModal';
import { CartDrawer } from './components/CartDrawer';
import { StudentOrdersView } from './components/StudentOrdersView';
import { BreakTimePlanner } from './components/BreakTimePlanner';
import { OwnerDashboard } from './components/OwnerDashboard';
import { FeedbackModal } from './components/FeedbackModal';
import { NotificationsModal } from './components/NotificationsModal';
import { DemoSwitchBar } from './components/DemoSwitchBar';
import { Canteen, MenuItem, Order, InAppNotification } from './types';
import { api } from './services/api';
import {
  Clock,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Flame,
} from 'lucide-react';

const MainApplication: React.FC = () => {
  const { user } = useAuth();
  const { addItem } = useCart();

  const [currentTab, setCurrentTab] = useState<string>('student_home');
  const [selectedCanteenId, setSelectedCanteenId] = useState<string>('canteen_a');

  // Server state
  const [canteens, setCanteens] = useState<{ canteenA: Canteen | null; canteenB: Canteen | null; recommendation: string }>({
    canteenA: null,
    canteenB: null,
    recommendation: '',
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Modals
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);

  // Initial tab based on role
  useEffect(() => {
    if (user?.role === 'owner' || user?.role === 'admin') {
      setCurrentTab('owner_overview');
    } else {
      setCurrentTab('student_home');
    }
  }, [user?.role]);

  // Load telemetry & synchronized state
  const loadAppState = async () => {
    try {
      const [compRes, menuRes, notifRes] = await Promise.all([
        api.getCanteenComparison(),
        api.getMenuItems(),
        api.getNotifications(),
      ]);

      if (compRes.success) {
        setCanteens({
          canteenA: compRes.canteenA,
          canteenB: compRes.canteenB,
          recommendation: compRes.recommendation,
        });
      }
      if (menuRes.success) {
        setMenuItems(menuRes.items);
      }
      if (notifRes.success) {
        setNotifications(notifRes.notifications);
        setUnreadCount(notifRes.unreadCount);
      }

      if (user?.role === 'student') {
        const ordRes = await api.getStudentOrders();
        if (ordRes.success) {
          setOrders(ordRes.orders);
        }
      }
    } catch (err) {
      console.error('Error fetching application state:', err);
    }
  };

  useEffect(() => {
    loadAppState();
    const interval = setInterval(loadAppState, 6000); // Poll every 6 seconds for live telemetry
    return () => clearInterval(interval);
  }, [user]);

  // Active student order for quick banner
  const activeStudentOrder = orders.find((o) =>
    ['pending_payment', 'awaiting_acceptance', 'accepted', 'preparing', 'ready_for_pickup'].includes(o.status)
  );

  const handleCustomizationAddToCart = (item: MenuItem, quantity: number, customizations: any[]) => {
    const result = addItem(item, quantity, customizations);
    if (!result.success && result.requiresReset) {
      if (
        window.confirm(
          `Your cart contains items from ${result.previousCanteenName}. Would you like to clear your cart to order from this canteen counter instead?`
        )
      ) {
        // clear and re-add
        setIsCartOpen(true);
      }
    } else {
      setIsCartOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* Top Navbar adhering to Top Bar Contract */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={unreadCount}
        openCart={() => setIsCartOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* STUDENT VIEWS */}
        {user?.role === 'student' && (
          <>
            {/* Active Order Prompt Banner (If Student has active order) */}
            {activeStudentOrder && currentTab !== 'my_orders' && (
              <div className="bg-emerald-900 text-white p-4 rounded-xl shadow-md flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-800 text-emerald-200 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    {activeStudentOrder.token}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block">
                      Active Order · {activeStudentOrder.status.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-emerald-50">
                      {activeStudentOrder.canteenId === 'canteen_a' ? 'Harvest Grill' : 'Banyan Court'} ·{' '}
                      {activeStudentOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentTab('my_orders')}
                  className="px-3.5 py-1.5 text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-800" />
                  <span>View Live Token & QR</span>
                </button>
              </div>
            )}

            {/* TAB 1: STUDENT HOME & CANTEEN COMPARISON */}
            {currentTab === 'student_home' && (
              <div className="space-y-8">
                {/* Hero Campus Banner */}
                <div className="relative rounded-2xl overflow-hidden bg-stone-900 text-white min-h-[260px] sm:min-h-[300px] flex items-center shadow-md">
                  <img
                    src="/src/assets/images/canteen_hero_banner_1791623245722.jpg"
                    alt="Campus Dining Hall"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-35"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/70 to-transparent" />

                  <div className="relative z-10 p-6 sm:p-10 max-w-2xl space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Smart Campus Dining & Queue Intelligence</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
                      Never Wait in Canteen Queues Again.
                    </h1>

                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl">
                      Live crowd telemetry across Canteen A & B, custom spice/sugar tailoring, concurrency-safe reservations, and 10-second QR pickup counter handoffs.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        onClick={() => setCurrentTab('menu')}
                        className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-2"
                      >
                        <span>Browse Full Menu</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setCurrentTab('break_planner')}
                        className="px-4 py-2.5 bg-stone-800/80 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs border border-stone-700 transition-colors flex items-center gap-2 backdrop-blur-xs"
                      >
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Break-Time Planner</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Canteen A vs Canteen B Live Telemetry Comparison */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black text-stone-900 tracking-tight">
                        Campus Canteens Live Workload Comparison
                      </h2>
                      <p className="text-xs text-stone-500">
                        Operational capacity, active kitchen queues, and verified inventory
                      </p>
                    </div>
                  </div>

                  <CanteenComparisonView
                    canteenA={canteens.canteenA}
                    canteenB={canteens.canteenB}
                    recommendation={canteens.recommendation}
                    onSelectCanteen={(canteenId) => {
                      setSelectedCanteenId(canteenId);
                      setCurrentTab('menu');
                    }}
                    onOpenBreakPlanner={() => setCurrentTab('break_planner')}
                  />
                </div>

                {/* Popular Campus Specials Strip */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-emerald-700" />
                      <span>Popular Campus Specialties</span>
                    </h3>
                    <button
                      onClick={() => setCurrentTab('menu')}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                    >
                      <span>View All Dishes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {menuItems.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setCustomizingItem(item)}
                        className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:border-emerald-600 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="h-32 w-full bg-stone-100 overflow-hidden relative">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            />
                            <div className="absolute top-2 left-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-900/80 text-white backdrop-blur-xs">
                                {item.canteenId === 'canteen_a' ? 'Canteen A' : 'Canteen B'}
                              </span>
                            </div>
                          </div>
                          <div className="p-3.5 space-y-1">
                            <h4 className="font-bold text-sm text-stone-900 leading-snug group-hover:text-emerald-800 transition-colors">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-stone-500 line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="p-3.5 pt-0 flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-stone-900 tabular-nums">
                            ₹{item.basePrice}
                          </span>
                          <span className="text-emerald-800 font-bold text-[11px]">
                            Customize →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MENU BROWSING & SEARCH */}
            {currentTab === 'menu' && (
              <MenuBrowser
                items={menuItems}
                selectedCanteenId={selectedCanteenId}
                onChangeCanteen={setSelectedCanteenId}
                onSelectItemForCustomization={(item) => setCustomizingItem(item)}
              />
            )}

            {/* TAB 3: BREAK-TIME PLANNER */}
            {currentTab === 'break_planner' && (
              <BreakTimePlanner
                onSelectItem={(item) => setCustomizingItem(item)}
              />
            )}

            {/* TAB 4: MY ORDERS & TRACKING */}
            {currentTab === 'my_orders' && (
              <StudentOrdersView
                orders={orders}
                onRefresh={loadAppState}
                onOpenFeedback={(order) => setReviewOrder(order)}
              />
            )}
          </>
        )}

        {/* OWNER & ADMIN VIEWS */}
        {(user?.role === 'owner' || user?.role === 'admin') && (
          <OwnerDashboard
            canteen={user?.canteenId === 'canteen_b' ? canteens.canteenB : canteens.canteenA}
            onRefreshCanteen={loadAppState}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium">
            <strong>CanteenIQ AI</strong> — Smart Food. Smarter Campus. (College Hackathon Production Prototype)
          </p>
          <p className="text-stone-400">
            Real-time workload calculation · Concurrency-safe transactions · Cryptographic QR verification
          </p>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Food Customization Modal */}
      <FoodCustomizationModal
        item={customizingItem}
        isOpen={!!customizingItem}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={handleCustomizationAddToCart}
      />

      {/* 2. Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderCreated={(createdOrder) => {
          loadAppState();
          setCurrentTab('my_orders');
        }}
      />

      {/* 3. Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onNotificationsUpdated={loadAppState}
      />

      {/* 4. Feedback Review Modal */}
      <FeedbackModal
        order={reviewOrder}
        isOpen={!!reviewOrder}
        onClose={() => setReviewOrder(null)}
        onFeedbackSubmitted={loadAppState}
      />

      {/* Floating Demo Persona Switcher */}
      <DemoSwitchBar onDataReset={loadAppState} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApplication />
      </CartProvider>
    </AuthProvider>
  );
}
