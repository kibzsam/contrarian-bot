import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import TradeList from '../components/TradeList';
import TradeDetail from '../components/TradeDetail';

export default function TradesPage() {
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: tradesData, isLoading } = useQuery({
    queryKey: ['trades', page],
    queryFn: async () => {
      const offset = (page - 1) * 20;
      const res = await fetch(`/api/dashboard/trades?limit=20&offset=${offset}`);
      return res.json();
    },
  });

  const { data: selectedTrade } = useQuery({
    queryKey: ['trade', selectedTradeId],
    queryFn: async () => {
      if (!selectedTradeId) return null;
      const res = await fetch(`/api/dashboard/trades/${selectedTradeId}`);
      return res.json();
    },
    enabled: !!selectedTradeId,
  });

  if (isLoading) {
    return <div className="p-8">Loading trades...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Trade History</h1>
        <p className="text-gray-600">View all executed trades with AI reasoning</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {tradesData && (
            <TradeList
              trades={tradesData.trades}
              selectedTradeId={selectedTradeId}
              onSelectTrade={setSelectedTradeId}
              total={tradesData.total}
              page={page}
              onPageChange={setPage}
            />
          )}
        </div>

        <div>
          {selectedTrade && <TradeDetail trade={selectedTrade} />}
        </div>
      </div>
    </div>
  );
}
