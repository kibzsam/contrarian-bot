import React from 'react';

interface Trade {
  id: string;
  marketName: string;
  orderType: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  reasoning: string;
  status: string;
  executedAt: string;
}

interface TradeDetailProps {
  trade: Trade;
}

export default function TradeDetail({ trade }: TradeDetailProps) {
  return (
    <div className="bg-white rounded-lg border p-6 sticky top-24">
      <h3 className="text-lg font-bold mb-4">Trade Details</h3>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Market</p>
          <p className="font-medium">{trade.marketName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p
              className={`font-medium ${
                trade.orderType === 'YES' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trade.orderType}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="font-medium">
              <span
                className={
                  trade.status === 'OPEN'
                    ? 'px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs'
                    : 'px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs'
                }
              >
                {trade.status}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Entry Price</p>
            <p className="font-medium">${trade.entryPrice.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Exit Price</p>
            <p className="font-medium">{trade.exitPrice ? `$${trade.exitPrice.toFixed(4)}` : '-'}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600">Quantity</p>
          <p className="font-medium">{trade.quantity.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">PnL</p>
          <p className={`text-xl font-bold ${trade.pnl && trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trade.pnl ? `$${trade.pnl.toFixed(2)}` : '-'}
          </p>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">AI Reasoning</p>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
            {trade.reasoning}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Executed: {new Date(trade.executedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
