import React from 'react';
import { Canteen } from '../types';
import { Building2, Clock, Users, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Sparkles, MapPin } from 'lucide-react';

interface CanteenComparisonViewProps {
  canteenA: Canteen | null;
  canteenB: Canteen | null;
  recommendation: string;
  onSelectCanteen: (canteenId: string) => void;
  onOpenBreakPlanner: () => void;
}

export const CanteenComparisonView: React.FC<CanteenComparisonViewProps> = ({
  canteenA,
  canteenB,
  recommendation,
  onSelectCanteen,
  onOpenBreakPlanner,
}) => {
  if (!canteenA || !canteenB) {
    return (
      <div className="py-12 text-center text-stone-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800 mb-3" />
        <p>Loading real-time campus canteen telemetry...</p>
      </div>
    );
  }

  const renderCrowdBadge = (level: string, index: number) => {
    let colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (level === 'Very High') colorClass = 'bg-red-50 text-red-800 border-red-200';
    else if (level === 'High') colorClass = 'bg-orange-50 text-orange-800 border-orange-200';
    else if (level === 'Moderate') colorClass = 'bg-amber-50 text-amber-800 border-amber-200';

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${colorClass}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        <span>{level} Crowd ({index}%)</span>
      </div>
    );
  };

  const renderCanteenCard = (canteen: Canteen, tag: 'A' | 'B') => {
    const isRecommended = recommendation.toLowerCase().includes(canteen.name.toLowerCase());

    return (
      <div
        className={`bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between ${
          isRecommended
            ? 'border-emerald-500/80 shadow-md ring-1 ring-emerald-400/30'
            : 'border-stone-200 hover:border-stone-300 shadow-sm'
        }`}
      >
        <div className="p-5 sm:p-6">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 tracking-wider">
                  CANTEEN {tag}
                </span>
                {canteen.isOpen ? (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Kitchen Active
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Closed
                  </span>
                )}
                {canteen.lunchActive && (
                  <span className="text-[11px] font-medium text-stone-500">
                    · Lunch Counter Serving
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-stone-900 leading-snug">
                {canteen.name}
              </h3>
              <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                {canteen.campusLocation}
              </p>
            </div>

            {/* Crowd Level */}
            <div>
              {renderCrowdBadge(canteen.crowdLevel, canteen.crowdIndex)}
            </div>
          </div>

          {/* Crowd Index Workload Bar */}
          <div className="mb-5 bg-stone-50 p-3 rounded-lg border border-stone-100">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-stone-700 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-stone-500" /> Kitchen Crowd Workload
              </span>
              <span className="font-mono tabular-nums text-stone-600">
                {canteen.currentWorkloadMinutes}m load / {canteen.capacityRate}m cap ({canteen.crowdIndex}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  canteen.crowdIndex >= 75
                    ? 'bg-red-500'
                    : canteen.crowdIndex >= 50
                    ? 'bg-orange-500'
                    : canteen.crowdIndex >= 25
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${canteen.crowdIndex}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500 mt-1.5 flex items-center justify-between">
              <span>{canteen.activeOrderCount} live student orders in queue</span>
              <span className="font-medium text-stone-700">~{canteen.estimatedWaitMinutes}m average wait</span>
            </p>
          </div>

          {/* Live Inventory Breakdown */}
          <div className="grid grid-cols-4 gap-2 mb-4 text-center">
            <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
              <span className="block text-base font-bold text-emerald-800 font-mono tabular-nums">
                {canteen.availableItemCount}
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                Available
              </span>
            </div>
            <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-100">
              <span className="block text-base font-bold text-amber-800 font-mono tabular-nums">
                {canteen.unavailableItemCount}
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                Inactive
              </span>
            </div>
            <div className="p-2 rounded-lg bg-red-50/70 border border-red-100">
              <span className="block text-base font-bold text-red-800 font-mono tabular-nums">
                {canteen.soldOutItemCount}
              </span>
              <span className="text-[10px] uppercase font-bold text-red-700 tracking-wider">
                Sold Out
              </span>
            </div>
            <div className="p-2 rounded-lg bg-stone-100 border border-stone-200">
              <span className="block text-base font-bold text-stone-800 font-mono tabular-nums">
                {canteen.totalItemCount}
              </span>
              <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider">
                Total Listed
              </span>
            </div>
          </div>
        </div>

        {/* Card Action */}
        <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between rounded-b-xl">
          <div className="text-xs text-stone-500">
            Updated <span className="font-mono tabular-nums">{new Date(canteen.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button
            onClick={() => onSelectCanteen(canteen.id)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <span>Browse {canteen.name} Menu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Live Operational Recommendation Banner */}
      {recommendation && (
        <div className="bg-emerald-900 text-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-emerald-200 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block">
                CanteenIQ Live Recommendation
              </span>
              <p className="text-sm font-medium text-emerald-50">
                {recommendation}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenBreakPlanner}
            className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-200" />
            <span>Short On Time? Launch Break Planner</span>
          </button>
        </div>
      )}

      {/* Canteen Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderCanteenCard(canteenA, 'A')}
        {renderCanteenCard(canteenB, 'B')}
      </div>
    </div>
  );
};
