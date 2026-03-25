import React from 'react';
import { Link } from '@tanstack/react-router';

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

interface RecentTradesProps {
  trades?: Trade[];
}

export default function RecentTrades({ trades }: RecentTradesProps) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Recent Trades</h2>
          <Link to="/trades" className="text-blue-600 hover:underline text-sm">
            View All
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
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
            {trades && trades.length > 0 ? (
              trades.slice(0, 5).map((trade) => (
                <tr key={trade.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{trade.marketName}</td>
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
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No trades yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
