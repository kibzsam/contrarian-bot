# Dashboard Setup Guide

This guide walks you through setting up the TanStack Start dashboard for your AI Contrarian Bot.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Express Server (port 3000)              │
├─────────────────────────────────────────────────────────┤
│  • Trading Bot Core (SignalScanner, DeepSeekBrain)      │
│  • PostgreSQL Database (Trades, Backtests, Markets)     │
│  • REST API Routes (/api/dashboard, /api/markets, etc)  │
│  • Serves TanStack Start Dashboard (SPA)                │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│         TanStack Start Dashboard (React frontend)        │
├─────────────────────────────────────────────────────────┤
│  • Pages: Dashboard, Trades, Markets, Backtest Results  │
│  • Components: Stats, Lists, Details, Search Filters    │
│  • React Query: Automatic data fetching & caching       │
│  • Tailwind CSS: Responsive styling                      │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local or Docker)
- npm or yarn

## Setup Steps

### 1. Install Dependencies

```bash
cd /path/to/ai-contrarian-bot

# Install backend dependencies
npm install

# Install dashboard dependencies
cd dashboard && npm install && cd ..
```

### 2. Create PostgreSQL Database

**Option A: Local PostgreSQL**
```bash
createdb ai-contrarian-bot
```

**Option B: Docker PostgreSQL**
```bash
docker run -d \
  --name postgres-contrarian \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ai-contrarian-bot \
  -p 5432:5432 \
  postgres:15
```

### 3. Configure Environment

Update `.env`:
```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai-contrarian-bot"

# Other existing variables...
DEEPSEEK_API_KEY=...
WSS_PROVIDER_URL=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### 4. Initialize Database Schema

```bash
# Run Prisma migrations
npm run db:migrate

# This creates all tables defined in prisma/schema.prisma
```

## Development

### Start Both Server & Dashboard

```bash
# Terminal 1: Runs Express backend + TanStack dashboard in dev mode
npm run dev
```

This starts:
- Express API server on `http://localhost:3000`
- TanStack Start dashboard on `http://localhost:5173` (dev)
- Dashboard proxies API calls to Express via `/api` proxy

### Manual Development (if you prefer separate terminals)

```bash
# Terminal 1: Backend only
npm run dev:server

# Terminal 2: Dashboard only
npm run dev:dashboard
```

### Build for Production

```bash
npm run build

# This builds:
# 1. TypeScript → JavaScript (dist/)
# 2. Dashboard → Vite production bundle
```

### Run Production Build

```bash
npm start

# Serves Express + compiled dashboard on port 3000
```

## API Integration

### Recording Trades

When your bot executes a trade, call:

```typescript
const response = await fetch('/api/dashboard/trades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    marketId: '0x1234...',
    marketName: 'Will Trump be re-elected?',
    orderType: 'YES',
    entryPrice: 0.65,
    quantity: 100,
    reasoning: 'DeepSeek analysis shows market underpricing...'
  })
});
```

### Updating Market Opportunities

For each scanned market, call:

```typescript
const response = await fetch('/api/markets/opportunities', {
  method: 'POST',
  body: JSON.stringify({
    marketId: '0x1234...',
    marketName: '...',
    category: 'politics',
    currentOdds: 0.65,
    liquidity: 50000,
    contraryScore: 0.78,
    recommendation: 'BUY_YES',
    reasoning: 'Whale accumulation + crowd panic = opportunity'
  })
});
```

### Saving Backtest Results

After each backtest run:

```typescript
const response = await fetch('/api/backtest', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Contrarian v1.0 @ USDT 2024',
    strategyVersion: '1.0.0',
    totalTrades: 145,
    winCount: 89,
    lossCount: 56,
    totalPnL: 2450.50,
    maxDrawdown: -5.2,
    sharpeRatio: 1.34,
    // ... other metrics
  })
});
```

See [DASHBOARD_API.md](./DASHBOARD_API.md) for complete API documentation.

## Dashboard Pages

### 1. **Dashboard** (`/`)
- **Stats Cards**: Today's PnL, Total PnL, Win Rate, Bankroll
- **Recent Trades**: Last 5 executed trades with quick view
- **Real-time Updates**: Refreshes every 30 seconds

### 2. **Trades** (`/trades`)
- **Trade List**: All executed trades with pagination
- **Trade Detail**: Full LLM reasoning + execution analysis
- **Expandable**: Click trade to see full reasoning
- **Filters**: Status (open/closed), date range

### 3. **Markets** (`/markets`)
- **Search**: Find markets by name
- **Filters**: Category, minimum contrarian score
- **Opportunities List**: AI-ranked markets by contrarian score
- **Quick View**: Market odds, liquidity, whale activity
- **Expandable Reasoning**: Why the AI recommends this market

### 4. **Backtest Results** (`/backtest`)
- **Comparison Stats**: Best win rate, Sharpe ratio, profitability
- **Backtest List**: All historical backtest runs
- **Detailed Metrics**: Win/loss, drawdown, Sortino ratio, profit factor
- **Trend Analysis**: Identify improving/degrading strategies

## Data Models

### Trade
```typescript
{
  id: string;
  marketId: string;
  marketName: string;
  orderType: 'YES' | 'NO';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  reasoning: string; // Full LLM analysis
  status: 'OPEN' | 'CLOSED' | 'CANCELED';
  executedAt: Date;
  closedAt?: Date;
}
```

### MarketOpportunity
```typescript
{
  marketId: string;
  marketName: string;
  category: string;
  currentOdds: number; // 0-1
  contraryScore: number; // 0-1 (1 = best opportunity)
  recommendation: 'BUY_YES' | 'BUY_NO' | 'AVOID';
  reasoning: string; // Why AI recommends this
  whaleActivity: 'ACCUMULATING' | 'DISTRIBUTING' | 'NEUTRAL';
}
```

### BacktestResult
```typescript
{
  name: string;
  strategyVersion: string;
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  sharpeRatio: number;
  maxDrawdown: number;
  parameters: JSON; // Strategy config
  results: JSON; // Detailed backtest data
}
```

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database name exists: `psql -l`

### Dashboard Not Loading
```
GET http://localhost:3000 → 404
```
- Build dashboard: `npm run build:dashboard`
- Check if files exist: `ls -la dashboard/dist/`
- Refresh browser cache

### API Calls Failing
```
POST /api/dashboard/trades → 500
```
- Check database migration ran: `npm run db:migrate`
- View server logs: `npm run dev`
- Check `.env` DATABASE_URL

### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
- Change port: `PORT=3001 npm run dev`
- Kill existing process: `lsof -i :3000 | kill`

## Deployment

### Docker Deployment
Update `Dockerfile`:
```dockerfile
# Build dashboard
RUN cd dashboard && npm install && npm run build && cd ..

# Build backend
RUN npm run build

# Serve with Express
CMD ["node", "dist/index.js"]
```

### Dokploy Deployment
1. Add repository in Dokploy
2. Set `DATABASE_URL` in environment variables
3. Run migrations in post-deploy hook: `npm run db:migrate`
4. Deploy

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full deployment instructions.

## Performance Tips

1. **Database Indexing**: Indexes on `marketId`, `executedAt`, `status` are already configured
2. **Pagination**: Trade list uses limit=20; adjust in components as needed
3. **React Query Caching**: Data auto-caches for 5 minutes by default
4. **Static Assets**: Dashboard is served from Express (no separate frontend server needed)

## Next Steps

1. ✅ Install dependencies
2. ✅ Create PostgreSQL database
3. ✅ Run `npm run db:migrate`
4. ✅ Start dev: `npm run dev`
5. 🔜 Visit `http://localhost:3000`
6. 🔜 Integrate trade recording in bot logic
7. 🔜 Update SignalScanner to call market opportunities API
8. 🔜 Save backtest results after each run

## File Structure

```
src/
  ├── routes/
  │   ├── dashboard.ts     # Trade stats & history endpoints
  │   ├── markets.ts       # Market opportunity endpoints
  │   └── backtest.ts      # Backtest result endpoints
  ├── db/
  │   └── database.ts      # Prisma client initialization
  └── index.ts             # Express app + bot orchestration

dashboard/
  ├── src/
  │   ├── routes/          # Page components
  │   │   ├── __root.tsx
  │   │   ├── index.tsx    # Dashboard page
  │   │   ├── trades.tsx   # Trades page
  │   │   ├── markets.tsx  # Markets page
  │   │   └── backtest.tsx # Backtest page
  │   ├── components/      # Reusable UI components
  │   ├── index.tsx        # React app entry
  │   └── index.css        # Tailwind styles
  ├── package.json
  ├── vite.config.ts
  └── tsconfig.json

prisma/
  └── schema.prisma       # Database schema
```

## Support

For issues or feature requests, check the main [README.md](./README.md) or [AGENTS.md](./AGENTS.md).
