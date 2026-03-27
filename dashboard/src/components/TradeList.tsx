
interface Trade {
  id: string;
  marketName: string;
  orderType: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  status: string;
  executedAt: string;
}

interface TradeListProps {
  trades: Trade[];
  selectedTradeId: string | null;
  onSelectTrade: (id: string) => void;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}

export default function TradeList({
  trades,
  selectedTradeId,
  onSelectTrade,
  total,
  page,
  onPageChange,
}: TradeListProps) {
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="bg-white rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Market</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Type</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Entry</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Exit</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">PnL</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {trades.map((trade) => (
              <tr
                key={trade.id}
                className={`cursor-pointer hover:bg-gray-50 ${
                  selectedTradeId === trade.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSelectTrade(trade.id)}
              >
                <td className="px-6 py-4 text-sm font-medium">{trade.marketName}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={trade.orderType === 'YES' ? 'text-green-600' : 'text-red-600'}>
                    {trade.orderType}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">${trade.entryPrice.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm">
                  {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {trade.pnl !== undefined ? (
                    <span className={trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${trade.pnl.toFixed(2)}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={
                      trade.status === 'OPEN'
                        ? 'px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs'
                        : 'px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs'
                    }
                  >
                    {trade.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t flex items-center justify-between">
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages} ({total} total)
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
