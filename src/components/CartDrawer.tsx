import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order, PaymentMethod } from '../types';
import {
  X,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Clock,
  AlertTriangle,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOrderCreated }) => {
  const { items, cartCanteenId, subtotal, removeItem, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const canteenName = cartCanteenId === 'canteen_a' ? 'Harvest Campus Grill (Block A)' : 'Banyan Court (Student Hub)';
  const totalPrepEstimate = items.reduce((max, item) => Math.max(max, item.prepTimeMinutes), 0) + (items.length > 2 ? 4 : 0);

  const handleCheckout = async () => {
    if (items.length === 0 || !cartCanteenId) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const payload = {
        canteenId: cartCanteenId,
        items: items.map((i) => ({
          itemId: i.itemId,
          quantity: i.quantity,
          selectedCustomizations: i.selectedCustomizations.map((c) => ({
            groupId: c.groupId,
            optionId: c.optionId,
          })),
        })),
        paymentMethod,
        specialInstructions: specialInstructions.trim() || undefined,
      };

      const res = await api.createOrder(payload);
      if (res.success && res.order) {
        clearCart();
        onClose();
        onOrderCreated(res.order);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please review items.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-stone-200">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900 leading-tight">
                  Your Food Tray
                </h3>
                {cartCanteenId && (
                  <p className="text-xs text-stone-500 font-medium">
                    Order from: {canteenName}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {items.length === 0 ? (
              <div className="py-20 text-center text-stone-400 space-y-3">
                <ShoppingBag className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-sm font-medium text-stone-600">Your tray is currently empty</p>
                <p className="text-xs text-stone-400 max-w-xs mx-auto">
                  Browse Canteen A or B and customize your meals with authentic spices, sugars, and side dishes!
                </p>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.cartId}
                      className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-stone-900">
                            {item.name}
                          </h4>
                          <span className="text-[11px] text-stone-500 font-mono tabular-nums">
                            Base: ₹{item.basePrice}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-sm text-stone-900 tabular-nums">
                          ₹{item.lineTotal}
                        </span>
                      </div>

                      {/* Customization Details Pill List */}
                      {item.selectedCustomizations.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-stone-200/60">
                          {item.selectedCustomizations.map((cust, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] text-stone-600 flex items-center justify-between"
                            >
                              <span>
                                {cust.groupTitle}: <strong className="font-medium text-stone-800">{cust.optionName}</strong>
                              </span>
                              {cust.priceDelta > 0 && (
                                <span className="font-mono text-emerald-800 tabular-nums">
                                  +₹{cust.priceDelta}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quantity & Remove Line */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center border border-stone-300 bg-white rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, -1)}
                            className="p-1.5 text-stone-600 hover:bg-stone-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 font-mono font-bold text-xs tabular-nums text-stone-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, 1)}
                            className="p-1.5 text-stone-600 hover:bg-stone-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.cartId)}
                          className="text-stone-400 hover:text-red-600 p-1 rounded transition-colors text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preparation Time Banner */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-900">
                  <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Estimated preparation & packaging: <strong>~{totalPrepEstimate} minutes</strong>
                  </span>
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Special Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Extra hot sambar, less oil, parcel packaging..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-emerald-700"
                  />
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        paymentMethod === 'online'
                          ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-semibold ring-1 ring-emerald-600'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <CreditCard className="w-4 h-4 text-emerald-700" />
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          Recommended
                        </span>
                      </div>
                      <span className="text-xs font-bold block">Online Instant Pay</span>
                      <span className="text-[10px] text-stone-500 font-normal">
                        10-Min Reserved Hold
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        paymentMethod === 'cash'
                          ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-semibold ring-1 ring-emerald-600'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Banknote className="w-4 h-4 text-emerald-700" />
                        <span className="text-[10px] text-stone-400">Counter</span>
                      </div>
                      <span className="text-xs font-bold block">Cash on Pickup</span>
                      <span className="text-[10px] text-stone-500 font-normal">
                        Pay at Counter Handoff
                      </span>
                    </button>
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="pt-2 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="font-mono tabular-nums text-stone-900 font-medium">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Campus Dining Tax & Service:</span>
                    <span className="font-mono tabular-nums text-emerald-800 font-semibold">₹0.00 (Zero Fee)</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-stone-900 pt-2 border-t border-stone-200">
                    <span>Total Amount to Pay:</span>
                    <span className="font-mono tabular-nums text-emerald-900">₹{subtotal}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer CTA */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200">
              <button
                disabled={submitting}
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {submitting ? (
                  <span>Securing Order & Validating Stock...</span>
                ) : (
                  <>
                    <span>Confirm Order & Generate Token</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-stone-500 text-center mt-2 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Prices & inventory verified by server transaction
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
