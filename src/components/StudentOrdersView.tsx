import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { api } from '../services/api';
import QRCode from 'qrcode';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Star,
  RefreshCw,
  UtensilsCrossed,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Ban,
  ChevronRight,
} from 'lucide-react';

interface StudentOrdersViewProps {
  orders: Order[];
  onRefresh: () => void;
  onOpenFeedback: (order: Order) => void;
}

export const StudentOrdersView: React.FC<StudentOrdersViewProps> = ({
  orders,
  onRefresh,
  onOpenFeedback,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Keep live second-by-second countdown for 10-minute unpaid payment timers
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update selected order when orders update
  useEffect(() => {
    if (orders.length > 0) {
      if (selectedOrder) {
        const found = orders.find((o) => o.id === selectedOrder.id);
        setSelectedOrder(found || orders[0]);
      } else {
        setSelectedOrder(orders[0]);
      }
    } else {
      setSelectedOrder(null);
    }
  }, [orders]);

  // Generate QR code whenever selectedOrder changes
  useEffect(() => {
    if (selectedOrder?.qrToken) {
      QRCode.toDataURL(selectedOrder.qrToken, {
        width: 256,
        margin: 2,
        color: {
          dark: '#064e3b', // emerald-900
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR:', err));
    }
  }, [selectedOrder]);

  const handlePayNow = async (orderId: string) => {
    try {
      setPayingOrderId(orderId);
      const res = await api.simulatePaymentSuccess(orderId);
      if (res.success && res.order) {
        onRefresh();
        setSelectedOrder(res.order);
      }
    } catch (err) {
      console.error('Payment simulation failed:', err);
    } finally {
      setPayingOrderId(null);
    }
  };

  const calculateRemainingPaymentSeconds = (deadlineIso: string) => {
    const deadline = new Date(deadlineIso).getTime();
    const remaining = Math.max(0, Math.floor((deadline - nowTimestamp) / 1000));
    return remaining;
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Status timeline steps
  const steps: { key: string; label: string }[] = [
    { key: 'placed', label: 'Order Placed' },
    { key: 'accepted', label: 'Accepted by Kitchen' },
    { key: 'preparing', label: 'Cooking & Packaging' },
    { key: 'ready_for_pickup', label: 'Ready for Counter Pickup' },
    { key: 'collected', label: 'Collected & Verified' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending_payment':
      case 'awaiting_acceptance':
        return 0;
      case 'accepted':
        return 1;
      case 'preparing':
        return 2;
      case 'ready_for_pickup':
        return 3;
      case 'collected':
        return 4;
      default:
        return -1; // rejected / cancelled / expired
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            My Campus Orders & Live Tracking
          </h2>
          <p className="text-xs text-stone-500">
            Track kitchen preparation status, verify pickup via QR code, and rate completed meals.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
          <span>Refresh Status</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-stone-200">
          <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">No Orders Placed Yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            Browse Canteen A or B menus to place your first smart campus meal order!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Orders List Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
              Recent Orders ({orders.length})
            </h3>
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {orders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                const remainingSecs = calculateRemainingPaymentSeconds(ord.paymentDeadline);
                const isUnpaidHold = ord.status === 'pending_payment';

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-600 shadow-sm ring-1 ring-emerald-500/20'
                        : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm px-2 py-0.5 rounded bg-stone-900 text-white tabular-nums">
                          {ord.token}
                        </span>
                        <span className="text-xs font-bold text-stone-800">
                          {ord.canteenId === 'canteen_a' ? 'Harvest Grill' : 'Banyan Court'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-sm text-stone-900 tabular-nums">
                        ₹{ord.total}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-1 mb-2">
                      {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-stone-200/60">
                      <span className="text-stone-500 font-mono tabular-nums">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {/* Status Badges */}
                      {ord.status === 'collected' ? (
                        <span className="text-emerald-800 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Collected
                        </span>
                      ) : ord.status === 'ready_for_pickup' ? (
                        <span className="text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
                          Ready for Pickup
                        </span>
                      ) : ord.status === 'preparing' ? (
                        <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
                          Cooking in Kitchen
                        </span>
                      ) : isUnpaidHold ? (
                        <span className="text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded font-bold text-[10px] tabular-nums">
                          Payment Pending ({formatCountdown(remainingSecs)})
                        </span>
                      ) : ord.status === 'expired' ? (
                        <span className="text-stone-500 bg-stone-200 px-2 py-0.5 rounded font-bold text-[10px]">
                          Hold Expired
                        </span>
                      ) : ord.status === 'rejected' ? (
                        <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded font-bold text-[10px]">
                          Declined
                        </span>
                      ) : (
                        <span className="text-stone-700 font-medium">Awaiting Kitchen</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Order Detail & Live Tracking Panel (7 cols) */}
          {selectedOrder && (
            <div className="lg:col-span-7 space-y-4">
              {/* Unpaid 10-Minute Alert Banner */}
              {selectedOrder.status === 'pending_payment' && (
                <div className="bg-amber-500/15 border border-amber-300 p-4 rounded-xl text-amber-950 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-800 shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-amber-900 leading-tight">
                          10-Minute Online Payment Hold Active
                        </h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                          Items reserved. You must verify payment before timeout or inventory will be automatically restored.
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-extrabold text-base text-amber-950 tabular-nums bg-amber-200/90 px-2 py-1 rounded-md block">
                        {formatCountdown(calculateRemainingPaymentSeconds(selectedOrder.paymentDeadline))}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePayNow(selectedOrder.id)}
                      disabled={payingOrderId === selectedOrder.id}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{payingOrderId === selectedOrder.id ? 'Processing...' : 'Simulate UPI Payment (Instant Pay)'}</span>
                    </button>
                    <span className="text-[11px] text-amber-800 font-medium">
                      Amount: ₹{selectedOrder.total}
                    </span>
                  </div>
                </div>
              )}

              {/* Order Tracking Card */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                {/* Header Strip */}
                <div className="p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                      Token Credential
                    </span>
                    <span className="font-mono font-extrabold text-2xl text-stone-900 tracking-tight">
                      {selectedOrder.token}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-stone-700 block">
                      {selectedOrder.canteenId === 'canteen_a' ? 'Harvest Campus Grill' : 'Banyan Court Canteen'}
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono tabular-nums">
                      {new Date(selectedOrder.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="p-5 border-b border-stone-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4">
                    Order Status Progress
                  </h4>

                  {selectedOrder.status === 'rejected' ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                      <span className="font-bold flex items-center gap-1.5 text-red-900">
                        <Ban className="w-4 h-4 text-red-700" /> Kitchen Declined Order
                      </span>
                      <p>Reason: {selectedOrder.rejectionReason || 'Item unavailable due to stock shortage.'}</p>
                    </div>
                  ) : selectedOrder.status === 'expired' ? (
                    <div className="p-4 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-600 space-y-1">
                      <span className="font-bold text-stone-800">10-Minute Hold Expired</span>
                      <p>This order was not confirmed within the 10-minute payment deadline. Stock was restored to cafeteria.</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                      {steps.map((st, idx) => {
                        const currentIndex = getStepIndex(selectedOrder.status);
                        const isDone = currentIndex >= idx;
                        const isCurrent = currentIndex === idx;

                        return (
                          <div key={st.key} className="relative flex items-center justify-between">
                            <div
                              className={`absolute -left-6 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-colors ${
                                isDone
                                  ? 'border-emerald-700 bg-emerald-700 text-white'
                                  : 'border-stone-300'
                              }`}
                            >
                              {isDone && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span
                              className={`text-xs ${
                                isCurrent
                                  ? 'font-extrabold text-emerald-900'
                                  : isDone
                                  ? 'font-medium text-stone-800'
                                  : 'text-stone-400 font-normal'
                              }`}
                            >
                              {st.label}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                Current
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* QR Code Pickup Credential Box */}
                <div className="p-5 border-b border-stone-100 bg-stone-50/60">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {qrDataUrl ? (
                      <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-xs shrink-0 text-center">
                        <img
                          src={qrDataUrl}
                          alt="Pickup Verification QR"
                          className="w-32 h-32 mx-auto"
                        />
                        <span className="block text-[10px] font-mono font-bold text-emerald-950 mt-1">
                          {selectedOrder.token}
                        </span>
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-stone-200 rounded-xl flex items-center justify-center text-stone-400">
                        <QrCode className="w-8 h-8" />
                      </div>
                    )}

                    <div className="space-y-2 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Cryptographic Pickup QR
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Present this dynamic QR code or state Token <strong>{selectedOrder.token}</strong> at the counter. Canteen staff will verify and hand over your meal.
                      </p>
                      <p className="text-[11px] text-stone-500 font-mono break-all">
                        Credential: {selectedOrder.qrToken.slice(0, 24)}...
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Ordered Snapshot */}
                <div className="p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Order Items Snapshot
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-start justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-stone-900">
                            {it.quantity}x {it.name}
                          </span>
                          {it.customizations.length > 0 && (
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              {it.customizations.map((c) => `${c.groupTitle}: ${c.optionName}`).join(' · ')}
                            </p>
                          )}
                        </div>
                        <span className="font-mono font-bold text-stone-900 tabular-nums">
                          ₹{it.itemTotal}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedOrder.specialInstructions && (
                    <div className="p-2.5 bg-stone-50 rounded-lg text-xs text-stone-600">
                      <strong>Special Note:</strong> {selectedOrder.specialInstructions}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-stone-200">
                    <span className="text-xs font-medium text-stone-600">Payment Status:</span>
                    <span
                      className={`text-xs font-bold capitalize ${
                        selectedOrder.paymentStatus === 'paid'
                          ? 'text-emerald-800'
                          : selectedOrder.paymentStatus === 'failed'
                          ? 'text-red-700'
                          : 'text-amber-800'
                      }`}
                    >
                      {selectedOrder.paymentStatus} ({selectedOrder.paymentMethod === 'online' ? 'Online' : 'Cash on Pickup'})
                    </span>
                  </div>

                  {/* Post-Collection Feedback Action */}
                  {selectedOrder.status === 'collected' && (
                    <div className="pt-2">
                      <button
                        onClick={() => onOpenFeedback(selectedOrder)}
                        className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold rounded-xl border border-emerald-300 text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <Star className="w-4 h-4 text-emerald-700 fill-emerald-700" />
                        <span>Rate & Review Food From This Order</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
