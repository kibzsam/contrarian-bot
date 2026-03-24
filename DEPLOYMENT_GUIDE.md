# AI Contrarian Bot - Deployment & Testing Guide

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Running in Dry-Run Mode](#running-in-dry-run-mode)
3. [Backtesting Guide](#backtesting-guide)
4. [Docker Build & Test](#docker-build--test)
5. [VPS Deployment with Dokploy](#vps-deployment-with-dokploy)
6. [OpenClaw Integration](#openclaw-integration)
7. [Monitoring & Logs](#monitoring--logs)

---

## Local Development Setup

### Prerequisites

- Node.js v20+ and npm v11+
- TypeScript 5.9+
- git
- **NO Docker, Telegram, or OpenClaw required for local testing**

### Install & Build

```bash
# Clone/navigate to project
cd /path/to/ai-contrarian-bot

# Install dependencies
npm install

# Build TypeScript
npm run build

# Verify build
ls -la dist/
```

### Environment Setup (Local)

```bash
# Create .env from template
cp .env.example .env

# For LOCAL testing, you can leave placeholders or use test values:
```

**For Local Testing (Optional):**
- `DEEPSEEK_API_KEY` - Set to `test` or leave blank; bot will use fallback heuristic
- `OPENAI_API_KEY` - Alternative, optional
- `PORT` - optional, defaults to 3000
- `TELEGRAM_BOT_TOKEN` - **NOT required locally** (only for VPS)
- `TELEGRAM_CHAT_ID` - **NOT required locally** (only for VPS)

**Note:** Telegram alerts and OpenClaw are **VPS-only features** (see [VPS Deployment](#vps-deployment-with-dokploy)). They are NOT needed for local dry-run or backtest.

### Run Development Server

```bash
# Using ts-node (live TypeScript)
npm run dev

# Or compiled JavaScript
npm run build && npm start
```

**Expected Output:**
```
Starting AI Contrarian Bot Orchestrator...
[CONFIG] Loaded strategy config: { ... }
OpenClaw Gateway initialized
Starting SignalScanner on wss://ws-subscriptions-clob.polymarket.com/ws/
Health check server listening on port 3000
```

### Test Health Endpoint

```bash
curl http://localhost:3000/health
# Returns: {"status":"ok"}
```

---

## Running in Dry-Run Mode

Dry-run mode uses simulated trading (**no real funds at risk**, **no external dependencies**).

### Configure Dry-Run (Local)

Edit `src/config/strategy_config.json`:

```json
{
  "dry_run_mode": true,
  "enable_deepseek": false,
  "starting_budget": 1000.0,
  "base_unit_size": 10.0,
  "whale_threshold": 5000,
  "panic_price_threshold": 0.3,
  "margin_of_safety": 0.08,
  "active_learning": true
}
```

- **dry_run_mode**: Disables real Polymarket calls; uses mock signals.
- **enable_deepseek**: If false, uses heuristic probability fallback (no API key needed).
- **starting_budget**: Safe test amount (default $21).
- **whale_threshold**: Lower for more frequent signals in testing.

### Run Dry-Run Locally (No OpenClaw/Telegram Needed)

```bash
npm run dev
```

Watch logs for:
- Market opportunities detected
- Trades executed (simulated)
- Budget updates
- Active learning adjustments

**No telegram alerts will be sent locally.** Telegram is **VPS-only** (enabled via `.env` on Contabo).

**Sample Output:**
```
[EVENT] Market opportunity detected for 0x123... at $0.25. Whale Buying: true
[ANALYSIS] Fair Value Probability: 65.0%. Reasoning: ...
[EXECUTE] Probabilistic Edge detected (margin > 0.08). Placing trade...
[Trade] executed trade_1711270400000. Waiting for fill...
Trade trade_1711270400000 won! Profit: $8.00. New budget: $24.00
[Telegram] Notifications disabled (missing bot token or chat ID)  // <-- Expected locally
```

---

## Backtesting Guide

### What Backtesting Does

- Replays synthetic (or historical) market snapshots
- Executes trades using the same bot logic
- Reports: win rate, profit, max drawdown, ROI
- Uses **zero real funds** — entirely simulated

### Run Synthetic Backtest

```bash
# Quick test: 3 tokens, 20 events
npm run backtest -- --mode synthetic --tokens 3 --events 20

# Larger test: 10 tokens, 500 events
npm run backtest -- --mode synthetic --tokens 10 --events 500
```

**Expected Output:**
```
[BacktestRunner] Starting backtest with 100 market snapshots
[BacktestRunner] Generating synthetic market data...
[Backtest CLI] Generating 100 market events across 10 tokens...

... (market events replayed) ...

========== BACKTEST RESULTS ==========
Total Trades: 15
Wins: 10, Losses: 5
Win Rate: 66.67%
Starting Budget: $21.00
Final Budget: $89.50
Total Profit: $68.50
ROI: 326.19%
Max Drawdown: 12.45%
======================================
```

### Load Historical Market Data

```bash
# Create market-data.json with array of snapshots:
cat > market-data.json << 'EOF'
[
  {
    "timestamp": 1711270400000,
    "tokenId": "0x123...",
    "price": 0.25,
    "volume": 15000,
    "isWhaleBuying": true
  },
  ...
]
EOF

# Run backtest
npm run backtest -- --mode file --data ./market-data.json
```

### Generate Backtest Reports

After backtest completes:
- Check logs for summary statistics
- Modify config thresholds based on results
- Re-run to validate improvements

---

## Docker Build & Test (Local)

### Build Image

```bash
# Build
docker build -t ai-contrarian-bot:latest .

# Verify image
docker images | grep ai-contrarian-bot
```

### Test Docker Locally (No OpenClaw/Telegram needed)

```bash
# Create .env.docker for testing (or use default .env)
cp .env.example .env.docker
# Leave placeholder values - no real API keys needed for dry-run

# Run container
docker run -d \
  --name ai-contrarian-bot-test \
  --env-file .env.docker \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  ai-contrarian-bot:latest

# Check logs
docker logs -f ai-contrarian-bot-test

# Test health
curl http://localhost:3000/health

# Stop
docker stop ai-contrarian-bot-test
docker rm ai-contrarian-bot-test
```

**Note:** Local Docker testing does NOT require:
- OpenClaw (VPS-only)
- Telegram setup (VPS-only)
- Real Polymarket wallet (uses mock trading)

### Run with Docker Compose Locally

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f ai-contrarian-bot

# Stop
docker-compose down
```

The `docker-compose.yml` is configured for **local testing by default** (no external network required).

**For VPS deployment**, Dokploy will handle networking automatically.


---

## VPS Deployment with Dokploy (with OpenClaw & Telegram)

**This is where OpenClaw and Telegram are configured for 24/7 trading on Contabo.**

### Prerequisites

1. **Contabo VPS** with Docker/Colima installed
2. **Dokploy** installed on VPS ([docs](https://dokploy.com))
3. **Git repository** (GitHub/GitLab) with this bot
4. **DeepSeek API key** (or OpenAI API key) - for AI probability analysis
5. **Telegram bot credentials** (required on VPS for alerts & OpenClaw):
   - Create bot: [@BotFather](https://t.me/BotFather) on Telegram
   - Get bot token and chat ID
6. **OpenClaw** (future integration, optional)

### Step 1: Connect Git Repository in Dokploy

1. Log into Dokploy dashboard on your VPS
2. Go to **Projects** → **+ New Project**
3. Connect your Git provider (GitHub/GitLab)
4. Select the ai-contrarian-bot repository
5. Choose branch (e.g., `main`)

### Step 2: Create Docker Application

1. In Dokploy, create a **Docker** deployment:
   - **Name:** `ai-contrarian-bot`
   - **Dockerfile Path:** `./Dockerfile`
   - **Build Context:** Root (`.`)
   - **Registry:** Leave empty (builds locally on VPS)

### Step 3: Configure Environment (VPS-Only)

In Dokploy → Application Settings → Environment:

```env
# Required: AI Analysis
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxx
# OR use OpenAI instead:
# OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxx

# Optional: Blockchain provider (for real order execution)
WSS_PROVIDER_URL=wss://polygon-mainnet.g.alchemy.com/v2/your-key-here

# Production settings
NODE_ENV=production
PORT=3000

# VPS-ONLY: Telegram Alerts (required for 24/7 notifications & OpenClaw)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz123456789
TELEGRAM_CHAT_ID=987654321

# VPS-ONLY: OpenClaw (future integration for remote bot control)
OPENCLAW_API_KEY=your-openclaw-key
```

**Important:**
- **DO NOT set Telegram credentials on your local machine** — they are VPS-only
- Local testing does NOT require Telegram or OpenClaw
- Only configure these env vars in Dokploy on the VPS

### Step 4: Configure Networking

- **Port:** `3000` (exposed)
- **Health Check:**
  - Type: HTTP
  - Path: `/health`
  - Interval: 30s
  - Timeout: 10s

### Step 5: Configure Storage (Volumes)

- **Source:** `/app/data` → **Dest:** `/data/ai-contrarian-bot` (persistent trades/config)
- **Source:** `/app/logs` → **Dest:** `/logs/ai-contrarian-bot` (persistent logs)

### Step 6: Deploy

1. Click **Deploy**
2. Monitor build and startup logs
3. Verify health check passes (green checkmark)
4. Check `/health` endpoint from browser or curl

### Step 7: Test in Production

```bash
# SSH into VPS
ssh user@your-vps-ip

# Check running container
docker ps | grep ai-contrarian-bot

# View logs
docker logs -f ai-contrarian-bot

# Test health
curl http://localhost:3000/health
```

---

## OpenClaw Integration (VPS-Only)

**OpenClaw is ONLY for the Contabo VPS deployment.** You do NOT need it locally.

OpenClaw enables **Telegram commands** to control the bot remotely (24/7 on VPS).

### OpenClaw on VPS Only

Once deployed to Contabo with Dokploy, OpenClaw will:
- Listen for Telegram commands
- Allow you to pause/resume trading
- Provide bot status updates
- Trigger manual audits

### Current OpenClaw Skills

From `openclaw.json`:
- **ContrarianAudit** - Manual market analysis override
- (Extensible: add `kill_switch`, `manual_audit` commands)

### Local Development: No OpenClaw Needed

- Dry-run locally: ✅ Works without OpenClaw
- Backtest locally: ✅ Works without OpenClaw
- Telegram alerts locally: ❌ Disabled (only on VPS)

Just run `npm run dev` and test the bot logic. No setup required.

### Enable OpenClaw on VPS (Future)

Once deployed to Contabo, OpenClaw will be configured to:
1. Listen for Telegram messages to your bot
2. Route commands to `ContrarianAudit` skill
3. Return bot status and accept remote control commands

**Example Telegram commands on VPS:**
```
/kill_switch - Emergency stop all trading
/manual_audit - Trigger risk analysis
/status - Get bot status
```

**Note:** Current code has OpenClaw stubbed; real integration requires OpenClaw SDK setup on VPS.

---

## Local Testing vs VPS Deployment

### Key Differences

| Feature | Local Dev/Testing | VPS (Contabo + Dokploy) |
|---------|------------------|------------------------|
| **Purpose** | Dry-run, backtest, dev | 24/7 automated trading |
| **OpenClaw** | ❌ Not needed | ✅ Enabled (Telegram control) |
| **Telegram Alerts** | ❌ Optional (disabled by default) | ✅ Required |
| **Real Trading** | ❌ Simulated (mock fills) | ✅ Real Polymarket orders |
| **Duration** | Minutes/hours | 24/7 continuous |
| **Market Data** | Synthetic or replayed | Live Polymarket WebSocket |
| **Setup Complexity** | Simple (node + npm) | Moderate (VPS + Dokploy) |
| **Cost** | Free (local dev machine) | $$ (VPS hosting) |

### Local Testing: What You Need

```bash
# That's it! Just Node.js
npm install
npm run build
npm run dev
npm run backtest -- --mode synthetic --tokens 5 --events 100
```

No Docker, no Telegram, no OpenClaw, no API keys required.

### VPS Deployment: What You Need

```
✅ Contabo VPS with Docker
✅ Dokploy installed
✅ GitHub/GitLab repo access
✅ DeepSeek or OpenAI API key
✅ Telegram bot token + chat ID (for alerts & OpenClaw)
✅ ~$5-10/month for VPS
```

---

## Monitoring & Logs

### View Local Logs

```bash
# If running with npm run dev
# Logs print to console (redirect with `tee`)

npm run dev | tee bot.log

# View recent logs
tail -f bot.log
```

### View Docker Logs

```bash
# Running container
docker logs -f ai-contrarian-bot

# Follow last 100 lines
docker logs --tail 100 -f ai-contrarian-bot

# Save to file
docker logs ai-contrarian-bot > bot-logs.txt 2>&1
```

### Key Log Patterns

```
[CONFIG] Loaded strategy config   # Startup info
[SignalScanner] Connected         # WebSocket active
[EVENT] Market opportunity        # Trade signal detected
[ANALYSIS] Fair Value              # AI probability analysis
[EXECUTE] Placed trade             # Trade submitted
[STRATEGY] Lesson Learned          # Active learning update
[Telegram] Notification sent       # Alert sent
```

### Persistent Strategy State

Strategy config and lessons persist in:
- **Local:** `src/config/strategy_config.json`, `src/config/strategy_lessons.json`
- **Docker:** `/app/data/` volume mounted

### Health Checks

```bash
# Quick health test
curl -s http://localhost:3000/health | jq

# Within container
docker exec ai-contrarian-bot curl http://localhost:3000/health
```

---

## Troubleshooting

### Bot won't start

- Check logs: `npm run dev` or `docker logs`
- Verify environment variables: `echo $DEEPSEEK_API_KEY`
- Check TypeScript compilation: `npm run build`

### No trades executed

- Verify market data is flowing (check logs for "Market opportunity")
- Lower `whale_threshold` and `panic_price_threshold` in config
- Check `margin_of_safety` is not too high
- If `enable_deepseek: false`, verify fallback heuristic triggers

### Health check failing

- Ensure port 3000 is open: `curl http://localhost:3000/health`
- Check Docker container logs for bindings
- Verify no port conflicts: `lsof -i :3000`

### Backtest not progressing

- Check API key is set or `enable_deepseek: false`
- Verify market data snapshots are loaded
- Monitor CPU/memory usage

---

## Summary of Commands

### Local Development (No OpenClaw/Telegram needed)

```bash
# Setup
npm install
npm run build

# Dry-run (simulated trading)
npm run dev

# Backtest (with synthetic data)
npm run backtest -- --mode synthetic --tokens 5 --events 100

# Docker testing (local, no OpenClaw)
docker build -t ai-contrarian-bot:test .
docker-compose up -d
```

### VPS Deployment (with OpenClaw & Telegram)

```bash
# Done via Dokploy dashboard (no CLI commands needed)
# 1. Connect GitHub repo
# 2. Create Docker project
# 3. Set environment variables (Telegram, DeepSeek, etc.)
# 4. Click Deploy
# 5. Monitor health check & logs in dashboard
```

---

## Next Steps

### Phase 1: Local Testing ✅ (you are here)

1. ✅ Environment setup (`npm install`, build)
2. ✅ Dry-run mode (`npm run dev`)
3. ✅ Backtest framework (`npm run backtest`)
4. ✅ Docker local test
5. ⏳ **Your next step:** Run `npm run dev` and test the bot locally

### Phase 2: VPS Deployment (when ready)

1. ⏳ Provision Contabo VPS with Docker/Colima
2. ⏳ Install Dokploy on VPS
3. ⏳ Connect GitHub repo to Dokploy
4. ⏳ Configure Telegram bot token + chat ID in Dokploy env
5. ⏳ Deploy and monitor

### Phase 3: Real Trading (future)

1. ⏳ Setup wallet with ethers.js
2. ⏳ Implement real CLOB order signing
3. ⏳ Testnet validation
4. ⏳ Mainnet deployment

---

## Quick Checklist: Start Local Testing Now

```
☐ npm install
☐ npm run build (verify no errors)
☐ npm run dev (see bot startup)
☐ Ctrl+C to stop (ctrl+C)
☐ npm run backtest -- --mode synthetic --tokens 3 --events 20 (quick backtest)
☐ Done! The bot works locally with no Telegram/OpenClaw needed.
```

---

## Questions?

Refer to `AGENTS.md` for project standards and `QUICKSTART.md` for quick reference.
