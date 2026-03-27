
interface Backtest {
  id: string;
  name: string;
  strategyVersion: string;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalPnL: number;
  sharpeRatio?: number;
  createdAt: string;
}

interface BacktestListProps {
  backtests: Backtest[];
  selectedBacktestId: string | null;
  onSelectBacktest: (id: string) => void;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}

export default function BacktestList({
  backtests,
  selectedBacktestId,
  onSelectBacktest,
  total,
  page,
  onPageChange,
}: BacktestListProps) {
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="bg-white rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Version</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Trades</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Win Rate</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Total PnL</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Sharpe</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {backtests.map((backtest) => (
              <tr
                key={backtest.id}
                className={`cursor-pointer hover:bg-gray-50 ${
                  selectedBacktestId === backtest.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSelectBacktest(backtest.id)}
              >
                <td className="px-6 py-4 text-sm font-medium">{backtest.name}</td>
                <td className="px-6 py-4 text-sm">{backtest.strategyVersion}</td>
                <td className="px-6 py-4 text-sm">
                  {backtest.totalTrades} ({backtest.winCount}W/{backtest.lossCount}L)
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {(backtest.winRate * 100).toFixed(1)}%
                </td>
                <td
                  className={`px-6 py-4 text-sm font-medium ${
                    backtest.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ${backtest.totalPnL.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {backtest.sharpeRatio ? backtest.sharpeRatio.toFixed(2) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t flex items-center justify-between">
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            ← Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
