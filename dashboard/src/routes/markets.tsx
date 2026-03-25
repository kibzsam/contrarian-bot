import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import MarketSearch from '../components/MarketSearch';
import OpportunitiesList from '../components/OpportunitiesList';

export default function MarketsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minScore, setMinScore] = useState(0.5);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['market-categories'],
    queryFn: async () => {
      const res = await fetch('/api/markets/categories');
      return res.json();
    },
  });

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['market-opportunities', selectedCategory, minScore],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('minScore', minScore.toString());

      const res = await fetch(`/api/markets/opportunities?${params}`);
      return res.json();
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Market Opportunities</h1>
        <p className="text-gray-600">Find and analyze contrarian trading opportunities</p>
      </div>

      <MarketSearch
        categories={categories || []}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        minScore={minScore}
        onMinScoreChange={setMinScore}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {isLoading ? (
        <div className="p-8">Loading opportunities...</div>
      ) : (
        <OpportunitiesList
          opportunities={opportunities || []}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
}
