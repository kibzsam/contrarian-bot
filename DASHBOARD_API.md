# Dashboard API Documentation

## Overview

The dashboard backend provides REST APIs for the TanStack Start frontend to access trading data, backtest results, and market opportunities.

## Database Setup

### Prerequisites
- PostgreSQL 14+
- Node.js 18+

### Initial Setup

```bash
# Install dependencies
npm install

# Create a PostgreSQL database
createdb ai-contrarian-bot

# Update .env with your DATABASE_URL
DATABASE_URL="postgresql://user:password@localhost:5432/ai-contrarian-bot"

# Run migrations
npm run db:migrate

# (Optional) Seed initial data
npm run db:seed
```

## API Endpoints

### Dashboard Stats
- **GET** `/api/dashboard/stats` - Overall performance metrics (PnL, win rate, bankroll)

### Trades
- **GET** `/api/dashboard/trades` - List all trades (paginated)
  - Query params: `limit=20`, `offset=0`
- **GET** `/api/dashboard/trades/:id` - Get single trade with full reasoning
- **POST** `/api/dashboard/trades` - Record new trade execution
  - Body: `{ marketId, marketName, orderType, entryPrice, quantity, reasoning }`
- **PATCH** `/api/dashboard/trades/:id/close` - Close a trade
  - Body: `{ exitPrice }`

### Markets & Opportunities
- **GET** `/api/markets/opportunities` - List market opportunities ranked by contrarian score
  - Query params: `limit=50`, `category=politics`, `minScore=0.7`
- **GET** `/api/markets/opportunities/:marketId` - Get single market opportunity
- **GET** `/api/markets/categories` - List all market categories
- **POST** `/api/markets/opportunities` - Create/update market opportunity (called by AI scanner)
  - Body: Full market opportunity data with AI reasoning

### Backtest Results
- **GET** `/api/backtest` - List backtest results
  - Query params: `limit=20`, `offset=0`
- **GET** `/api/backtest/:id` - Get detailed backtest result
- **POST** `/api/backtest` - Save new backtest run
  - Body: Backtest metrics, parameters, and detailed results
- **GET** `/api/backtest/stats/comparison` - Performance comparison of last 10 backtests

## Data Models

### Trade
```typescript
{
  id: string;
  marketId: string;
  marketName: string;
  orderType: "YES" | "NO";
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number; // (exitPrice - entryPrice) * quantity
  status: "OPEN" | "CLOSED" | "CANCELED";
  reasoning: string; // Full LLM reasoning
  executedAt: Date;
  closedAt?: Date;
}
```

### MarketOpportunity
```typescript
{
  id: string;
  marketId: string;
  marketName: string;
  category: string;
  currentOdds: number; // 0-1 (YES token price)
  liquidity: number;
  volume24h: number;
  spread: number;
  timeToResolution: number; // Days
  crowdSentiment: number; // 0-1 (bullishness)
  contraryScore: number; // 0-1 (1 = best opportunity)
  whaleActivity: "ACCUMULATING" | "DISTRIBUTING" | "NEUTRAL";
  recommendation: "BUY_YES" | "BUY_NO" | "AVOID";
  reasoning: string; // LLM analysis
  lastUpdated: Date;
}
```

### BacktestResult
```typescript
{
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
  startDate: Date;
  endDate: Date;
  parameters: JSON; // Strategy parameters
  results: JSON; // Detailed backtest results
}
```

### BankrollSnapshot
```typescript
{
  id: string;
  totalBankroll: number;
  availableBalance: number;
  usedInTrades: number;
  dailyPnL: number;
  cumulativePnL: number;
  winRateToday: number;
  snapshotAt: Date;
}
```

## Integration with Bot Services

### Recording Trades
When the bot executes a trade, it should call:
```typescript
POST /api/dashboard/trades {
  marketId: "0x123...",
  marketName: "Will Trump be re-elected in 2024?",
  orderType: "YES",
  entryPrice: 0.55,
  quantity: 100,
  reasoning: "Whale accumulation detected. Market sentiment: 72% YES. DeepSeek analysis shows fundamentals underpriced."
}
```

### Closing Trades
When a trade is closed:
```typescript
PATCH /api/dashboard/trades/{tradeId}/close {
  exitPrice: 0.68
}
```

### Updating Market Opportunities
The `SignalScanner` should periodically update market opportunities:
```typescript
POST /api/markets/opportunities {
  marketId: "0x123...",
  marketName: "...",
  category: "politics",
  currentOdds: 0.55,
  liquidity: 50000,
  volume24h: 12000,
  spread: 0.02,
  timeToResolution: 30,
  crowdSentiment: 0.72,
  contraryScore: 0.78,
  whaleActivity: "ACCUMULATING",
  recommendation: "BUY_YES",
  reasoning: "..."
}
```

### Saving Backtest Results
After a backtest run:
```typescript
POST /api/backtest {
  name: "Contrarian v1.0 on USDT 2024",
  strategyVersion: "1.0.0",
  totalTrades: 145,
  winCount: 89,
  lossCount: 56,
  totalPnL: 2450.50,
  maxDrawdown: -5.2,
  sharpeRatio: 1.34,
  sortinoRatio: 1.89,
  profitFactor: 2.1,
  avgWin: 32.50,
  avgLoss: -18.22,
  startDate: "2024-01-01",
  endDate: "2024-03-01",
  parameters: { 
    sentiment_threshold: 0.7,
    min_liquidity: 10000,
    max_position_size: 0.1
  },
  results: { /* detailed results */ }
}
```

## Development

```bash
# Start dev server with database
npm run dev

# Build
npm run build

# Just start backend
npm run dev:server

# Just start dashboard frontend
npm run dev:dashboard
```

## Production Deployment

See `DEPLOYMENT_GUIDE.md` for Dokploy setup with PostgreSQL.

## Security Notes

- All API endpoints should be behind authentication once deployed
- Never log private keys or sensitive trading data
- Use environment variables for all credentials
- Sanitize user inputs before storing
