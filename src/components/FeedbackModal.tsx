import React, { useState } from 'react';
import { Order } from '../types';
import { api } from '../services/api';
import { X, Star, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FeedbackModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onFeedbackSubmitted: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  order,
  isOpen,
  onClose,
  onFeedbackSubmitted,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  React.useEffect(() => {
    if (order && order.items.length > 0) {
      setSelectedItemId(order.items[0].itemId);
      setRating(5);
      setComment('');
      setError(null);
      setSuccess(false);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await api.submitFeedback({
        orderId: order.id,
        itemId: selectedItemId,
        rating,
        comment,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onFeedbackSubmitted();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-stone-900">
              Rate Order {order.token}
            </h3>
            <p className="text-xs text-stone-500">
              Verified Post-Collection Meal Review
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-8 text-center text-emerald-800 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-base">Thank You for Your Feedback!</h4>
            <p className="text-xs text-stone-500">Your rating helps improve campus dining quality.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Item Selector */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Which Dish Are You Rating?
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium text-stone-800 focus:outline-none focus:border-emerald-700"
              >
                {order.items.map((it) => (
                  <option key={it.itemId} value={it.itemId}>
                    {it.name} (Qty: {it.quantity})
                  </option>
                ))}
              </select>
            </div>

            {/* Star Rating Selector */}
            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Food Quality & Preparation: {rating} / 5 Stars
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 text-stone-300 transition-colors focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Your Review (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the taste, packaging temperature, spice level?"
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-800 h-24 focus:outline-none focus:bg-white focus:border-emerald-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-100 text-stone-700 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
