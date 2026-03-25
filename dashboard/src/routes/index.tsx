import { useQuery } from '@tanstack/react-query';
import React from 'react';
import DashboardStats from '../components/DashboardStats';
import RecentTrades from '../components/RecentTrades';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Trading Dashboard</h1>
        <p className="text-gray-600">Monitor your bot's performance, trades, and opportunities</p>
      </div>

      {stats && (
        <>
          <DashboardStats stats={stats} />
          <RecentTrades />
        </>
      )}
    </div>
  );
}
