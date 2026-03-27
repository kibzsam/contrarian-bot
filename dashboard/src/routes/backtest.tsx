import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import BacktestList from '../components/BacktestList';
import BacktestDetail from '../components/BacktestDetail';

export default function BacktestPage() {
  const [selectedBacktestId, setSelectedBacktestId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: backtestsData, isLoading } = useQuery({
    queryKey: ['backtests', page],
    queryFn: async () => {
      const offset = (page - 1) * 20;
      const res = await fetch(`/api/backtest?limit=20&offset=${offset}`);
      return res.json();
    },
  });

  const { data: selectedBacktest } = useQuery({
    queryKey: ['backtest', selectedBacktestId],
    queryFn: async () => {
      if (!selectedBacktestId) return null;
      const res = await fetch(`/api/backtest/${selectedBacktestId}`);
      return res.json();
    },
    enabled: !!selectedBacktestId,
  });

  const { data: comparisonStats } = useQuery({
    queryKey: ['backtest-comparison'],
    queryFn: async () => {
      const res = await fetch('/api/backtest/stats/comparison');
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading backtest results...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Backtest Results</h1>
        <p className="text-gray-600">Review strategy performance across different market conditions</p>
      </div>

      {comparisonStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Best Win Rate</p>
            <p className="text-2xl font-bold">{(comparisonStats.bestWinRate * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Best Sharpe Ratio</p>
            <p className="text-2xl font-bold">{comparisonStats.bestSharpe.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Best Total PnL</p>
            <p className="text-2xl font-bold text-green-600">${comparisonStats.bestTotalPnL.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Avg Win Rate</p>
            <p className="text-2xl font-bold">{(comparisonStats.averageWinRate * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {backtestsData && (
            <BacktestList
              backtests={backtestsData.results}
              selectedBacktestId={selectedBacktestId}
              onSelectBacktest={setSelectedBacktestId}
              total={backtestsData.total}
              page={page}
              onPageChange={setPage}
            />
          )}
        </div>

        <div>
          {selectedBacktest && <BacktestDetail backtest={selectedBacktest} />}
        </div>
      </div>
    </div>
  );
}
