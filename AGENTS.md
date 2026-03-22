# AGENTS.md - AI Contrarian Bot

## Project Overview

A Node.js/Express TypeScript project for an AI contrarian trading bot. The project uses Express for the web server, Ethers for blockchain interactions, and the Polybased SDK.

## Build Commands

```bash
# Build TypeScript to JavaScript
npm run build

# Run the development server with ts-node
npx ts-node src/index.ts

# Run in production (after build)
node dist/index.js
```

## Testing

**Note:** No test framework is currently configured. When adding tests:

```bash
# Run all tests
npm test

# Run a single test file
npx jest testName.test.ts

# Run tests in watch mode
npx jest --watch
```

Recommended test framework: **Jest** with **ts-jest** for TypeScript support.

## Linting

No linting is currently configured. Recommended tools:

```bash
# ESLint
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npx eslint src/**/*.ts

# Or using Biome (faster, all-in-one)
npm install --save-dev @biomejs/biome
npx biome check src/
```

## Code Style Guidelines

### TypeScript Configuration

- Uses `strict: true` in tsconfig.json
- All code must compile without errors
- Enable strict null checks and strict mode

### Imports

```typescript
// Order: external libs, then internal modules
import express from 'express';
import { ethers } from 'ethers';

import { someFunction } from './utils/someModule';
import { SomeClass } from './services/SomeClass';
```

### Naming Conventions

- **Files**: kebab-case (e.g., `user-service.ts`, `trade-utils.ts`)
- **Classes**: PascalCase (e.g., `OrderBook`, `TradeExecutor`)
- **Functions/variables**: camelCase (e.g., `getBalance`, `pendingTrades`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRIES`, `DEFAULT_GAS_LIMIT`)
- **Interfaces**: PascalCase with optional "I" prefix (e.g., `TradeOrder`, `IOrderBook`)

### Type Annotations

- Always use explicit return types for functions
- Prefer interfaces over types for object shapes
- Use `unknown` instead of `any`, then narrow appropriately

```typescript
// Good
function calculateProfit(buyPrice: number, sellPrice: number): number {
  return sellPrice - buyPrice;
}

// Bad
function calculateProfit(buyPrice, sellPrice) {
  return sellPrice - buyPrice;
}
```

### Error Handling

- Use custom error classes for domain-specific errors
- Always handle async errors with try/catch or .catch()
- Log errors with appropriate context
- Never expose raw errors to API clients

```typescript
class TradeExecutionError extends Error {
  constructor(message: string, public readonly orderId: string) {
    super(message);
    this.name = 'TradeExecutionError';
  }
}

async function executeTrade(order: Order): Promise<TradeResult> {
  try {
    return await executeOrder(order);
  } catch (error) {
    logger.error('Trade execution failed', { orderId: order.id, error });
    throw new TradeExecutionError('Failed to execute trade', order.id);
  }
}
```

### Async/Await

- Always handle promise rejections
- Avoid unnecessary try/catch for simple forward propagation
- Use `Promise.all()` for parallel operations when appropriate

```typescript
// Good - parallel execution
const [price, balance] = await Promise.all([
  getPrice(token),
  getBalance(wallet)
]);

// Good - simple forward
const result = await riskyOperation();
```

### Logging

- Use descriptive log messages with context
- Log levels: error, warn, info, debug
- Avoid logging sensitive data (private keys, API keys)

```typescript
logger.info('Order placed', { orderId: order.id, amount: order.amount });
logger.error('Failed to fetch price', { token, error: error.message });
```

### Environment Variables

- Never commit secrets to version control
- Use `.env` files for local development
- Validate required env vars at startup
- Document all environment variables in `.env.example`

### Docker

- Multi-stage build (builder + production)
- Run as non-root user
- Expose only necessary ports

### File Organization

```
src/
  index.ts          # Entry point
  services/         # Business logic
  utils/            # Helper functions
  types/            # TypeScript interfaces/types
  middleware/      # Express middleware
  config/          # Configuration
```

### General Best Practices

- Keep functions small and focused (single responsibility)
- Early returns for error conditions
- Prefer immutable patterns where possible
- Add JSDoc comments for complex public APIs
- Keep the codebase DRY (Don't Repeat Yourself)

---

## Deployment Guide (Contabo + Dokploy + OpenClaw + Telegram)

### Prerequisites

1. Contabo VPS with Docker installed
2. Dokploy installed on the server
3. Telegram Bot created via @BotFather
4. OpenClaw account and API key

### Telegram Setup

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram
2. Get your bot token (format: `123456789:ABCdef...`)
3. Start a chat with your bot and get your `chat_id`:
   ```bash
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
4. The `chat_id` will be in the response under `message.chat.id`

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
DEEPSEEK_API_KEY=your-deepseek-api-key
WSS_PROVIDER_URL=wss://polygon-mainnet.g.alchemy.com/v2/your-api-key
PORT=3000
NODE_ENV=production

# Telegram notifications
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

# OpenClaw
OPENCLAW_API_KEY=your-openclaw-api-key
```

### Deploy with Dokploy

1. **Connect Repository**: In Dokploy, add your Git repository containing this project

2. **Create Project**:
   - Project Type: `Docker`
   - Build Type: `Dockerfile`

3. **Configure Build**:
   - Dockerfile Path: `Dockerfile`
   - Build Command: (leave empty, Dockerfile handles it)

4. **Configure Container**:
   - Container Name: `ai-contrarian-bot`
   - Port: `3000`
   - Health Check: `http://localhost:3000/health`

5. **Environment Variables**: Add all vars from `.env` in Dokploy's env section

6. **Volumes** (for persistence):
   - `/app/data` → `/data/ai-contrarian-bot`
   - `/app/logs` → `/logs/ai-contrarian-bot`

7. **Deploy**: Click deploy and monitor logs

### OpenClaw Setup

OpenClaw enables Telegram commands to control the bot. Configure via `openclaw.json`:

```json
{
  "name": "ai-contrarian-bot",
  "version": "1.0.0",
  "endpoint": "dist/index.js",
  "gateway": {
    "protocol": "websockets",
    "commands": ["kill_switch", "manual_audit"]
  }
}
```

Available commands:
- `kill_switch` - Emergency stop all trading
- `manual_audit` - Trigger manual market analysis

### Docker Commands (Manual)

```bash
# Build image
docker build -t ai-contrarian-bot .

# Run with env file
docker run -d \
  --name ai-contrarian-bot \
  --env-file .env \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v ./logs:/app/logs \
  --restart unless-stopped \
  ai-contrarian-bot

# View logs
docker logs -f ai-contrarian-bot

# Stop
docker stop ai-contrarian-bot

# Restart
docker restart ai-contrarian-bot
```

### Notification Events

The bot sends Telegram notifications for:
- `BOT_STARTED` - Bot goes online
- `PANIC_DETECTED` - Panic selling + whale activity detected
- `TRADE_EXECUTED` - A trade is placed
- `TRADE_WON` - Trade resulted in profit
- `TRADE_LOST` - Trade resulted in loss
- `BOT_STOPPED` - Bot receives shutdown signal
- `ERROR` - Any error occurs

### Health Check

```bash
curl http://your-server:3000/health
# Returns: {"status": "ok"}
```

### Monitoring

View real-time logs in Dokploy dashboard or via:
```bash
docker logs -f ai-contrarian-bot --tail 100
```
