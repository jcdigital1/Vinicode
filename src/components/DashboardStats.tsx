import React from 'react';
import { QrCode, CheckCircle2, PauseCircle, Activity } from 'lucide-react';
import { DashboardStats as StatsType } from '../types.ts';

interface DashboardStatsProps {
  stats: StatsType;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div
      id="dashboard-stats-panel"
      className="w-full bg-[#141417]/90 backdrop-blur-sm border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg shadow-black/40"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-800/70">
        {/* Total QR Codes */}
        <div id="stat-total-qrcodes" className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {stats.total}
            </div>
            <div className="text-xs sm:text-sm font-medium text-zinc-400 mt-0.5">
              QR Codes
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-800/60 flex items-center justify-center text-zinc-300">
            <QrCode className="w-5 h-5 text-red-500" />
          </div>
        </div>

        {/* Ativos */}
        <div id="stat-active-qrcodes" className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
              {stats.active}
            </div>
            <div className="text-xs sm:text-sm font-medium text-zinc-400 mt-0.5">
              Ativos
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Inativos */}
        <div id="stat-inactive-qrcodes" className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-300 tracking-tight">
              {stats.inactive}
            </div>
            <div className="text-xs sm:text-sm font-medium text-zinc-400 mt-0.5">
              Inativos
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-800/60 flex items-center justify-center text-zinc-400">
            <PauseCircle className="w-5 h-5 text-zinc-400" />
          </div>
        </div>

        {/* Leituras */}
        <div id="stat-total-scans" className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {stats.totalScans}
            </div>
            <div className="text-xs sm:text-sm font-medium text-zinc-400 mt-0.5">
              Leituras Totais
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-950/40 border border-red-800/30 flex items-center justify-center text-red-400">
            <Activity className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
