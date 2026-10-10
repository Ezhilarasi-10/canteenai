import React from 'react';
import { InAppNotification } from '../types';
import { api } from '../services/api';
import {
  X,
  Bell,
  Clock,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  UtensilsCrossed,
  DollarSign,
  Star,
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InAppNotification[];
  onNotificationsUpdated: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onNotificationsUpdated,
  onSelectOrder,
}) => {
  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    onNotificationsUpdated();
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    onNotificationsUpdated();
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'ready_for_pickup':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'order_preparing':
        return <UtensilsCrossed className="w-4 h-4 text-amber-600" />;
      case 'payment_pending':
      case 'payment_reminder':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'payment_expired':
      case 'order_rejected':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'feedback_reminder':
        return <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-700" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-800" />
            <h3 className="font-extrabold text-base text-stone-900">
              Campus Notifications
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Notifications List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-stone-100">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-stone-400 space-y-2">
              <Bell className="w-10 h-10 mx-auto stroke-1" />
              <p className="text-sm font-medium text-stone-600">No Notifications Yet</p>
              <p className="text-xs">You're all caught up with kitchen updates!</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                className={`p-3 rounded-xl transition-colors cursor-pointer pt-3 ${
                  n.isRead
                    ? 'bg-transparent text-stone-600 hover:bg-stone-50'
                    : 'bg-emerald-50/60 border border-emerald-100 text-stone-900 font-medium'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 p-1 rounded-lg bg-white border border-stone-200 shrink-0">
                      {getNotifIcon(n.type)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-snug">
                        {n.title}
                      </h4>
                      <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-stone-400 mt-1 block font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
