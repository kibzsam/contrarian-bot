import React from 'react';

interface DashboardStatsProps {
  stats: {
    todayPnL: number;
    totalPnL: number;
    totalTrades: number;
    winRate: number;
    wins: number;
    losses: number;
    bankroll: number;
    availableBalance: number;
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const profitColor = stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600';
  const todayColor = stats.todayPnL >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-lg border">
        <p className="text-sm text-gray-600 mb-1">Today's PnL</p>
        <p className={`text-3xl font-bold ${todayColor}`}>
          ${stats.todayPnL.toFixed(2)}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <p className="text-sm text-gray-600 mb-1">Total PnL</p>
        <p className={`text-3xl font-bold ${profitColor}`}>
          ${stats.totalPnL.toFixed(2)}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <p className="text-sm text-gray-600 mb-1">Win Rate</p>
        <p className="text-3xl font-bold">{(stats.winRate * 100).toFixed(1)}%</p>
        <p className="text-xs text-gray-500 mt-2">
          {stats.wins}W / {stats.losses}L
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <p className="text-sm text-gray-600 mb-1">Bankroll</p>
        <p className="text-3xl font-bold">${stats.bankroll.toFixed(2)}</p>
        <p className="text-xs text-gray-500 mt-2">
          Available: ${stats.availableBalance.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
