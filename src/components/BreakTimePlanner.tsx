import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { api } from '../services/api';
import { Clock, Sparkles, Filter, AlertCircle, ArrowRight, CheckCircle2, DollarSign } from 'lucide-react';

interface BreakTimePlannerProps {
  onSelectItem: (item: MenuItem) => void;
}

export const BreakTimePlanner: React.FC<BreakTimePlannerProps> = ({ onSelectItem }) => {
  const [breakMinutes, setBreakMinutes] = useState<number>(15);
  const [maxWaitMinutes, setMaxWaitMinutes] = useState<number>(10);
  const [category, setCategory] = useState<string>('all');
  const [maxBudget, setMaxBudget] = useState<number | ''>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<
    (MenuItem & { estimatedReadyMinutes: number; fitsBreak: boolean; reason: string })[]
  >([]);
  const [canteenSummary, setCanteenSummary] = useState<{ [id: string]: { crowdLevel: string; wait: number } }>({});

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.getBreakRecommendations({
        breakMinutes,
        maxWaitMinutes,
        category: category === 'all' ? undefined : category,
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
      });

      if (res.success) {
        setRecommendations(res.recommendations);
        setCanteenSummary(res.canteenSummary);
      }
    } catch (err) {
      console.error('Failed to load break recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [breakMinutes, maxWaitMinutes, category, maxBudget]);

  const presetBreaks = [10, 15, 20, 30, 45];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-800 text-emerald-200 flex items-center justify-center">
            <Clock className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Smart Break-Time Food Recommender
            </h2>
            <p className="text-xs text-emerald-200">
              Calculate kitchen wait + prep times to find meals you can order and eat before your next lecture starts.
            </p>
          </div>
        </div>

        {/* Inputs Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Remaining Break Preset */}
          <div className="bg-emerald-800/60 p-3 rounded-xl border border-emerald-700/50">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
              Break Remaining (Mins)
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {presetBreaks.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    setBreakMinutes(b);
                    setMaxWaitMinutes(Math.max(5, b - 5));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all tabular-nums ${
                    breakMinutes === b
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'bg-emerald-900/80 text-emerald-200 hover:bg-emerald-700'
                  }`}
                >
                  {b}m
                </button>
              ))}
            </div>
          </div>

          {/* Max Waiting Window */}
          <div className="bg-emerald-800/60 p-3 rounded-xl border border-emerald-700/50">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
              Max Wait for Food: {maxWaitMinutes}m
            </label>
            <input
              type="range"
              min="3"
              max={Math.max(5, breakMinutes - 2)}
              value={maxWaitMinutes}
              onChange={(e) => setMaxWaitMinutes(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Category Filter */}
          <div className="bg-emerald-800/60 p-3 rounded-xl border border-emerald-700/50">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-1 bg-emerald-900 border border-emerald-700 text-white rounded-lg text-xs font-medium focus:outline-none"
            >
              <option value="all">Any Category</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="snacks">Snacks</option>
              <option value="meals">Meals</option>
              <option value="beverages">Beverages</option>
            </select>
          </div>

          {/* Max Budget */}
          <div className="bg-emerald-800/60 p-3 rounded-xl border border-emerald-700/50">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
              Budget Cap (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-2.5 py-1 bg-emerald-900 border border-emerald-700 text-white rounded-lg text-xs font-medium placeholder-emerald-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Disclaimers & Telemetry Bar */}
      <div className="p-3 bg-stone-100 rounded-xl text-xs text-stone-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border border-stone-200">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>
            Real-time kitchen workload: Canteen A ({canteenSummary.canteen_a?.crowdLevel || 'Moderate'} crowd ~{canteenSummary.canteen_a?.wait || 12}m) vs Canteen B ({canteenSummary.canteen_b?.crowdLevel || 'Low'} crowd ~{canteenSummary.canteen_b?.wait || 6}m).
          </span>
        </span>
        <span className="text-[11px] text-stone-400 italic">
          *All times are dynamic operational estimates.
        </span>
      </div>

      {/* Recommendations Cards */}
      {loading ? (
        <div className="py-16 text-center text-stone-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800 mb-3" />
          <p>Analyzing kitchen queue and active order workloads...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-stone-200">
          <AlertCircle className="w-10 h-10 text-stone-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-stone-800">No Food Items Fit This Narrow Time Window</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            Increase your allowable wait time or look for fast quick-service beverages.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recommendations.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all ${
                item.fitsBreak
                  ? 'border-emerald-500/80 shadow-xs ring-1 ring-emerald-500/10'
                  : 'border-stone-200 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                      {item.canteenId === 'canteen_a' ? 'Harvest Grill (A)' : 'Banyan Court (B)'}
                    </span>
                    <h3 className="font-extrabold text-base text-stone-900 leading-snug">
                      {item.name}
                    </h3>
                  </div>
                  <span className="font-mono font-bold text-base text-stone-900 tabular-nums">
                    ₹{item.basePrice}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100 text-xs text-stone-700 space-y-1 mb-3">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" /> Total Wait:
                    </span>
                    <span className="font-mono tabular-nums text-emerald-900">
                      ~{item.estimatedReadyMinutes} minutes
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-tight">
                    {item.reason}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSelectItem(item)}
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <span>Select & Customize</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
