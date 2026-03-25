import React from 'react';

interface MarketSearchProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  minScore: number;
  onMinScoreChange: (score: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function MarketSearch({
  categories,
  selectedCategory,
  onCategoryChange,
  minScore,
  onMinScoreChange,
  searchQuery,
  onSearchChange,
}: MarketSearchProps) {
  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Search Market</label>
        <input
          type="text"
          placeholder="Search by market name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Min Contrarian Score: {minScore.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={minScore}
          onChange={(e) => onMinScoreChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
