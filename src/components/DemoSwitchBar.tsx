import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Users, RotateCcw, ShieldCheck, ChevronUp, ChevronDown, Check } from 'lucide-react';

interface DemoSwitchBarProps {
  onDataReset: () => void;
}

export const DemoSwitchBar: React.FC<DemoSwitchBarProps> = ({ onDataReset }) => {
  const { user, demoUsers, switchUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);

  const handleResetSeed = async () => {
    if (!window.confirm('Reset all canteen inventory, sample orders, and notifications to initial hackathon seed state?')) {
      return;
    }
    try {
      setResetting(true);
      await api.resetSeedData();
      onDataReset();
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <aside aria-label="Hackathon Evaluation Bar" className="fixed bottom-3 right-3 z-40 max-w-md">
      <div className="bg-stone-900/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-stone-800 p-3 text-xs">
        {/* Compact Toggle Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-[11px] tracking-wide text-stone-200">
              Demo Role:{' '}
              <strong className="text-emerald-400">
                {user?.role === 'owner'
                  ? user.canteenId === 'canteen_a'
                    ? 'Chef Raman (Canteen A)'
                    : 'Chef Anita (Canteen B)'
                  : user?.role === 'admin'
                  ? 'Admin Directorate'
                  : 'Student (Priya)'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
              title="Expand Switcher"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleResetSeed}
              disabled={resetting}
              className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
              title="Reset Demo Seed Data"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Panel */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-stone-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              1-Click Instant Persona Switcher
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {demoUsers.map((u) => {
                const isActive = user?.id === u.id;
                let label = u.name.split(' ')[0];
                if (u.role === 'owner') {
                  label = u.canteenId === 'canteen_a' ? 'Chef Raman (A)' : 'Chef Anita (B)';
                } else if (u.role === 'admin') {
                  label = 'Campus Admin';
                }

                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u);
                      setIsExpanded(false);
                    }}
                    className={`p-2 rounded-lg text-left text-[11px] font-medium transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-emerald-800 text-white font-bold ring-1 ring-emerald-500'
                        : 'bg-stone-800/90 text-stone-300 hover:bg-stone-700 hover:text-white'
                    }`}
                  >
                    <span>{label}</span>
                    {isActive && <Check className="w-3 h-3 text-emerald-300" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleResetSeed}
              disabled={resetting}
              className="w-full mt-1 py-1.5 px-2 bg-stone-800 hover:bg-red-950 text-stone-300 hover:text-red-200 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Canteens & Seed State</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
