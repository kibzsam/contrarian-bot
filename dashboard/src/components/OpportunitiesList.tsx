import React from 'react';

interface Opportunity {
  id: string;
  marketId: string;
  marketName: string;
  category: string;
  currentOdds: number;
  liquidity: number;
  volume24h: number;
  spread: number;
  timeToResolution: number;
  crowdSentiment: number;
  contraryScore: number;
  whaleActivity: string;
  recommendation: string;
  reasoning: string;
}

interface OpportunitiesListProps {
  opportunities: Opportunity[];
  searchQuery: string;
}

export default function OpportunitiesList({ opportunities, searchQuery }: OpportunitiesListProps) {
  const filtered = opportunities.filter((opp) =>
    opp.marketName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRecommendationColor = (rec: string) => {
    if (rec === 'BUY_YES') return 'text-green-600';
    if (rec === 'BUY_NO') return 'text-red-600';
    return 'text-gray-600';
  };

  const getWhaleActivityColor = (activity: string) => {
    if (activity === 'ACCUMULATING') return 'bg-green-100 text-green-800';
    if (activity === 'DISTRIBUTING') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border text-center text-gray-500">
          No market opportunities found
        </div>
      ) : (
        filtered.map((opp) => (
          <div key={opp.id} className="bg-white rounded-lg border p-6 hover:shadow-lg transition">
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg">{opp.marketName}</h3>
                  <p className="text-sm text-gray-600">{opp.category}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getRecommendationColor(opp.recommendation)}`}>
                    {opp.recommendation.replace('_', ' ')}
                  </p>
                  <p className="text-sm font-bold text-blue-600">Score: {opp.contraryScore.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600">YES Token Price</p>
                <p className="font-bold">${opp.currentOdds.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Liquidity</p>
                <p className="font-bold">${(opp.liquidity / 1000).toFixed(1)}K</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Crowd Sentiment</p>
                <p className="font-bold">{(opp.crowdSentiment * 100).toFixed(0)}% bullish</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Days to Resolve</p>
                <p className="font-bold">{opp.timeToResolution}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-3">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getWhaleActivityColor(opp.whaleActivity)}`}
              >
                {opp.whaleActivity}
              </span>
              <span className="text-xs text-gray-500">Spread: {(opp.spread * 100).toFixed(2)}%</span>
            </div>

            <details className="text-sm text-gray-700">
              <summary className="font-medium cursor-pointer hover:text-blue-600">
                View AI Reasoning
              </summary>
              <div className="mt-3 p-3 bg-gray-50 rounded">
                {opp.reasoning}
              </div>
            </details>
          </div>
        ))
      )}
    </div>
  );
}
