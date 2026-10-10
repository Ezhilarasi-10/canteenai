import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Canteen, Order, MenuItem, CanteenAnalytics, FeedbackReview, OrderStatus } from '../types';
import { api } from '../services/api';
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  DollarSign,
  Star,
  Users,
  ShieldCheck,
  Ban,
  MessageSquare,
} from 'lucide-react';

interface OwnerDashboardProps {
  canteen: Canteen | null;
  onRefreshCanteen: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ canteen, onRefreshCanteen }) => {
  const { user } = useAuth();
  const canteenId = user?.canteenId || 'canteen_a';

  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'qr_scanner' | 'analytics'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [analytics, setAnalytics] = useState<CanteenAnalytics | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Rejection modal state
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Kitchen capacity full for this item.');

  // QR / Token verification state
  const [verifyInput, setVerifyInput] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string; order?: Order } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // New Item Modal
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<string>('snacks');
  const [newItemPrice, setNewItemPrice] = useState<number>(60);
  const [newItemPrepTime, setNewItemPrepTime] = useState<number>(5);
  const [newItemStock, setNewItemStock] = useState<number>(25);
  const [newItemDesc, setNewItemDesc] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, menuRes, analRes, feedRes] = await Promise.all([
        api.getOwnerOrders(canteenId),
        api.getMenuItems({ canteenId }),
        api.getCanteenAnalytics(canteenId),
        api.getCanteenFeedback(canteenId),
      ]);

      if (ordRes.success) setOrders(ordRes.orders);
      if (menuRes.success) setMenuItems(menuRes.items);
      if (analRes.success) setAnalytics(analRes.analytics);
      if (feedRes.success) setFeedbackList(feedRes.feedback);
    } catch (err) {
      console.error('Failed to load owner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [canteenId]);

  // Order action
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus, reason?: string) => {
    try {
      const res = await api.updateOrderStatus(orderId, newStatus, reason);
      if (res.success) {
        setRejectingOrder(null);
        loadData();
        onRefreshCanteen();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  // Stock update
  const handleAdjustStock = async (itemId: string, newStock: number) => {
    try {
      const res = await api.adjustStock(itemId, newStock);
      if (res.success) {
        setMenuItems((prev) => prev.map((i) => (i.id === itemId ? res.item : i)));
        onRefreshCanteen();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  // Canteen open / lunch toggle
  const handleToggleCanteenStatus = async (field: 'open' | 'lunch') => {
    if (!canteen) return;
    try {
      const newOpen = field === 'open' ? !canteen.isOpen : canteen.isOpen;
      const newLunch = field === 'lunch' ? !canteen.lunchActive : canteen.lunchActive;
      const res = await api.updateCanteenStatus(canteenId, newOpen, newLunch);
      if (res.success) {
        onRefreshCanteen();
      }
    } catch (err) {
      console.error('Failed to update canteen status:', err);
    }
  };

  // Verify Pickup Token or QR
  const handleVerifyPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyInput.trim()) return;

    try {
      setIsVerifying(true);
      setVerificationResult(null);
      const res = await api.verifyPickup(canteenId, verifyInput.trim());
      setVerificationResult({
        success: true,
        message: res.message,
        order: res.order,
      });
      setVerifyInput('');
      loadData();
      onRefreshCanteen();
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: err.message || 'Verification failed.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Add Item Submit
  const handleCreateItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const res = await api.createMenuItem({
        canteenId,
        name: newItemName.trim(),
        description: newItemDesc.trim() || 'Fresh campus preparation made to order.',
        category: newItemCategory as any,
        basePrice: Number(newItemPrice),
        imageUrl: '/src/assets/images/campus_burger_fries_1791623284757.jpg',
        prepTimeMinutes: Number(newItemPrepTime),
        stockQuantity: Number(newItemStock),
        lowStockThreshold: 8,
        isAvailable: Number(newItemStock) > 0,
        isLunchOnly: newItemCategory === 'lunch',
        isActive: true,
        customizationGroups: [],
      });

      if (res.success) {
        setShowAddItemModal(false);
        setNewItemName('');
        setNewItemDesc('');
        loadData();
        onRefreshCanteen();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add item');
    }
  };

  return (
    <div className="space-y-6">
      {/* Canteen Management Top Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 uppercase">
              Authorized Owner Console
            </span>
            <span className="text-xs text-stone-500 font-mono">
              Canteen ID: {canteenId}
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 leading-tight">
            {canteen?.name || 'Campus Canteen'}
          </h2>
          <p className="text-xs text-stone-500">
            {canteen?.campusLocation} · Capacity: {canteen?.capacityRate}m workload
          </p>
        </div>

        {/* Operational Switches */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleToggleCanteenStatus('open')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border shadow-xs ${
              canteen?.isOpen
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                : 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100'
            }`}
          >
            {canteen?.isOpen ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Kitchen Open for Orders</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-700" />
                <span>Kitchen Closed</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleToggleCanteenStatus('lunch')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border shadow-xs ${
              canteen?.lunchActive
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Lunch Counter: {canteen?.lunchActive ? 'Active' : 'Closed'}</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            title="Refresh All"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-stone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Today's Orders
            </span>
            <span className="text-xl font-extrabold text-stone-900 font-mono tabular-nums">
              {analytics.todayOrdersCount}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Confirmed Sales
            </span>
            <span className="text-xl font-extrabold text-emerald-900 font-mono tabular-nums">
              ₹{analytics.confirmedRevenue}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Active In Kitchen
            </span>
            <span className="text-xl font-extrabold text-amber-800 font-mono tabular-nums">
              {analytics.activeOrdersCount}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Unpaid (10m Hold)
            </span>
            <span className="text-xl font-extrabold text-stone-700 font-mono tabular-nums">
              {analytics.pendingPaymentOrdersCount}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Low Stock Items
            </span>
            <span className="text-xl font-extrabold text-red-700 font-mono tabular-nums">
              {analytics.lowStockItems.length}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Crowd Workload
            </span>
            <span className="text-xl font-extrabold text-stone-900 font-mono tabular-nums">
              {analytics.crowdIndex}%
            </span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Incoming Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('qr_scanner')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'qr_scanner'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>QR & Token Pickup Verification</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Menu & Stock Inventory ({menuItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Financial Reports & Student Reviews</span>
        </button>
      </div>

      {/* TAB 1: INCOMING ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-stone-900">
              Live Kitchen Tickets
            </h3>
            <span className="text-xs text-stone-500">
              Sorted by order submission time
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-stone-200">
              <UtensilsCrossed className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-600">No Orders in Kitchen Queue</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className={`bg-white rounded-xl border p-4.5 flex flex-col justify-between space-y-3 transition-all ${
                    ord.status === 'ready_for_pickup'
                      ? 'border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                      : ord.status === 'preparing'
                      ? 'border-amber-400'
                      : ord.status === 'pending_payment'
                      ? 'border-stone-300 opacity-80'
                      : 'border-stone-200'
                  }`}
                >
                  <div>
                    {/* Header: Token + Status */}
                    <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-stone-100">
                      <div>
                        <span className="font-mono font-black text-lg text-stone-900 tabular-nums">
                          {ord.token}
                        </span>
                        <span className="block text-xs text-stone-600 font-medium">
                          {ord.studentName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-stone-900 tabular-nums block">
                          ₹{ord.total}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            ord.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {ord.paymentStatus} ({ord.paymentMethod})
                        </span>
                      </div>
                    </div>

                    {/* Order Items & Customizations */}
                    <div className="space-y-2 mb-3">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="text-xs text-stone-800 bg-stone-50 p-2 rounded-lg">
                          <div className="flex justify-between font-bold">
                            <span>{it.quantity}x {it.name}</span>
                            <span className="font-mono">₹{it.itemTotal}</span>
                          </div>
                          {it.customizations.length > 0 && (
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              {it.customizations.map((c) => `${c.groupTitle}: ${c.optionName}`).join(' · ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {ord.specialInstructions && (
                      <p className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        <strong>Note:</strong> {ord.specialInstructions}
                      </p>
                    )}
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="pt-2 border-t border-stone-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>Status: <strong className="text-stone-800 capitalize">{ord.status.replace('_', ' ')}</strong></span>
                      <span className="font-mono tabular-nums">{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {ord.status === 'awaiting_acceptance' && (
                        <>
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'accepted')}
                            className="py-1.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => setRejectingOrder(ord)}
                            className="py-1.5 px-3 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {ord.status === 'accepted' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                          className="col-span-2 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
                        >
                          Mark Cooking / Preparing
                        </button>
                      )}

                      {ord.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'ready_for_pickup')}
                          className="col-span-2 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
                        >
                          Mark Ready for Counter Pickup
                        </button>
                      )}

                      {ord.status === 'ready_for_pickup' && (
                        <button
                          onClick={() => {
                            setActiveTab('qr_scanner');
                            setVerifyInput(ord.token);
                          }}
                          className="col-span-2 py-2 px-3 bg-stone-900 hover:bg-black text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Verify Pickup Handover</span>
                        </button>
                      )}

                      {ord.status === 'collected' && (
                        <div className="col-span-2 py-1.5 text-center text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-lg">
                          Collected & Verified
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QR & TOKEN PICKUP SCANNER */}
      {activeTab === 'qr_scanner' && (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-stone-900">
              Counter Pickup Verification Scanner
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Scan student's QR code credential or enter the short Order Token (e.g. <strong>A101</strong>) to release meals securely.
            </p>
          </div>

          <form onSubmit={handleVerifyPickup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Enter Order Token or QR String
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. A101, B201, or scanned QR payload..."
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value)}
                  className="flex-1 p-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono uppercase font-bold text-stone-800 focus:outline-none focus:bg-white focus:border-emerald-700"
                />
                <button
                  type="submit"
                  disabled={isVerifying || !verifyInput.trim()}
                  className="px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Pickup'}
                </button>
              </div>
            </div>

            {/* Quick test buttons for active ready tokens */}
            {orders.filter((o) => ['ready_for_pickup', 'accepted', 'preparing'].includes(o.status)).length > 0 && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                  Quick Select Active Order Token:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {orders
                    .filter((o) => ['ready_for_pickup', 'accepted', 'preparing'].includes(o.status))
                    .map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setVerifyInput(o.token)}
                        className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs font-mono font-bold text-stone-800 hover:border-emerald-600"
                      >
                        {o.token} ({o.studentName.split(' ')[0]})
                      </button>
                    ))}
                </div>
              </div>
            )}
          </form>

          {/* Verification Feedback Result */}
          {verificationResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                verificationResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {verificationResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-700" />
                )}
                <span>{verificationResult.message}</span>
              </div>

              {verificationResult.order && (
                <div className="p-3 bg-white/80 rounded-lg border border-emerald-200 text-stone-800 space-y-1">
                  <p><strong>Customer:</strong> {verificationResult.order.studentName}</p>
                  <p><strong>Token:</strong> {verificationResult.order.token}</p>
                  <p><strong>Items:</strong> {verificationResult.order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}</p>
                  <p><strong>Payment:</strong> Verified {verificationResult.order.paymentMethod} (₹{verificationResult.order.total})</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MENU & STOCK INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-stone-900">
                Menu Items & Stock Inventory
              </h3>
              <p className="text-xs text-stone-500">
                Adjust stock levels, set low-stock thresholds, and manage active items
              </p>
            </div>

            <button
              onClick={() => setShowAddItemModal(true)}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Menu Item</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">Food Item</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Prep Time</th>
                    <th className="p-3.5">Stock Level</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Quick Stock Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {menuItems.map((item) => {
                    const isSoldOut = item.stockQuantity <= 0;
                    const isLowStock = !isSoldOut && item.stockQuantity <= item.lowStockThreshold;

                    return (
                      <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="p-3.5 font-bold text-stone-900">
                          {item.name}
                          {item.customizationGroups.length > 0 && (
                            <span className="block text-[10px] text-emerald-800 font-normal">
                              {item.customizationGroups.length} customization groups configured
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 capitalize text-stone-600">
                          {item.category}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-stone-900 tabular-nums">
                          ₹{item.basePrice}
                        </td>
                        <td className="p-3.5 font-mono tabular-nums text-stone-600">
                          ~{item.prepTimeMinutes}m
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-bold tabular-nums text-sm">
                            {item.stockQuantity}
                          </span>
                          <span className="text-[10px] text-stone-400 block">
                            Threshold: {item.lowStockThreshold}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {isSoldOut ? (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">
                              Sold Out
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Available
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleAdjustStock(item.id, Math.max(0, item.stockQuantity - 5))}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded font-mono font-bold text-stone-700"
                              title="-5"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => handleAdjustStock(item.id, Math.max(0, item.stockQuantity - 1))}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded font-mono font-bold text-stone-700"
                              title="-1"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => handleAdjustStock(item.id, item.stockQuantity + 5)}
                              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 rounded font-mono font-bold text-emerald-800"
                              title="+5"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleAdjustStock(item.id, item.stockQuantity + 20)}
                              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 rounded font-mono font-bold text-emerald-800"
                              title="+20"
                            >
                              +20
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FINANCIAL REPORTS & REVIEWS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Confirmed Sales & Popular Dishes Card */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <span>Top Selling Dishes by Confirmed Revenue</span>
              </h3>

              <div className="space-y-3">
                {analytics.popularItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-stone-900">{idx + 1}. {item.name}</span>
                      <span className="block text-[11px] text-stone-500 font-mono tabular-nums">
                        {item.count} portions sold
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-900 tabular-nums">
                      ₹{item.revenue}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Student Reviews & Ratings Card */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-700 fill-emerald-700" />
                  <span>Student Feedback & Reviews</span>
                </h3>
                <span className="font-mono font-bold text-sm text-stone-900 tabular-nums">
                  ⭐ {analytics.averageRating} ({analytics.totalReviews} reviews)
                </span>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {feedbackList.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">No reviews submitted yet.</p>
                ) : (
                  feedbackList.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs space-y-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-900">{rev.studentName}</span>
                        <div className="flex text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-stone-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-stone-700 italic">"{rev.comment}"</p>
                      <span className="text-[10px] text-stone-400 block font-mono">
                        {rev.itemName} · {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h4 className="font-extrabold text-base text-stone-900">
              Decline Order {rejectingOrder.token}
            </h4>
            <p className="text-xs text-stone-600">
              Please provide a mandatory reason explaining why this order cannot be prepared at this time.
            </p>
            <input
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Fresh ingredients exhausted / Grill maintenance"
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:bg-white focus:border-red-600"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 bg-stone-100 text-stone-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateOrderStatus(rejectingOrder.id, 'rejected', rejectionReason)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
              >
                Confirm Decline & Restore Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW MENU ITEM MODAL */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h4 className="font-extrabold text-base text-stone-900">
              Add New Food Item to {canteen?.name}
            </h4>
            <form onSubmit={handleCreateItemSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Poha & Roasted Peanuts"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-800"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="snacks">Snacks</option>
                    <option value="meals">Meals</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    min="10"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemPrepTime}
                    onChange={(e) => setNewItemPrepTime(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description</label>
                <textarea
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Ingredients, accompaniments and dietary details..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-800 h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl"
                >
                  Publish to Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
