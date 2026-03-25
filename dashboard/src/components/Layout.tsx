import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold">⚡ AI Contrarian Bot</h1>
            <div className="flex space-x-6">
              <a href="/" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </a>
              <a href="/trades" className="text-gray-700 hover:text-blue-600">
                Trades
              </a>
              <a href="/markets" className="text-gray-700 hover:text-blue-600">
                Markets
              </a>
              <a href="/backtest" className="text-gray-700 hover:text-blue-600">
                Backtest
              </a>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  );
}
