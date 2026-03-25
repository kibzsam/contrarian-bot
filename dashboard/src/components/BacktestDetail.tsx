import React from 'react';

interface Backtest {
  id: string;
  name: string;
  strategyVersion: string;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio?: number;
  sortinoRatio?: number;
  profitFactor?: number;
  avgWin?: number;
  avgLoss?: number;
  startDate: string;
  endDate: string;
  parameters: Record<string, any>;
  results: Record<string, any>;
}

interface BacktestDetailProps {
  backtest: Backtest;
}

export default function BacktestDetail({ backtest }: BacktestDetailProps) {
  return (
    <div className="bg-white rounded-lg border p-6 sticky top-24">
      <h3 className="text-lg font-bold mb-4">{backtest.name}</h3>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-600">Strategy Version</p>
          <p className="font-medium">{backtest.strategyVersion}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600">Total Trades</p>
            <p className="text-lg font-bold">{backtest.totalTrades}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Win Rate</p>
            <p className="text-lg font-bold text-green-600">{(backtest.winRate * 100).toFixed(1)}%</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-600">W/L Ratio</p>
          <p className="font-medium">
            {backtest.winCount}W / {backtest.lossCount}L
          </p>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-gray-600">Total PnL</p>
          <p className={`text-2xl font-bold ${backtest.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${backtest.totalPnL.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-600">Avg Win</p>
            <p className="font-medium text-green-600">
              {backtest.avgWin ? `$${backtest.avgWin.toFixed(2)}` : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Avg Loss</p>
            <p className="font-medium text-red-600">
              ${backtest.avgLoss ? backtest.avgLoss.toFixed(2) : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Max Drawdown</p>
            <p className="font-medium">{(backtest.maxDrawdown * 100).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Profit Factor</p>
            <p className="font-medium">{backtest.profitFactor ? backtest.profitFactor.toFixed(2) : '-'}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-gray-600">Sharpe Ratio</p>
          <p className="font-bold text-lg">
            {backtest.sharpeRatio ? backtest.sharpeRatio.toFixed(2) : '-'}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-600 mb-1">Sortino Ratio</p>
          <p className="font-medium">{backtest.sortinoRatio ? backtest.sortinoRatio.toFixed(2) : '-'}</p>
        </div>

        <div>
          <p className="text-xs text-gray-600">Backtest Period</p>
          <p className="text-xs">
            {new Date(backtest.startDate).toLocaleDateString()} to{' '}
            {new Date(backtest.endDate).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
