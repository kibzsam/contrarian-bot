# Quick Start Checklist

## ✅ Phase 1: Local Development (Complete)

- [x] Environment setup (`npm install`, `.env` created)
- [x] TypeScript build verification
- [x] Health endpoint configured
- [x] Fallback AI probability (no API key needed)

## ✅ Phase 2: Testing & Dry-Run (Complete)

- [x] Backtest module (`BacktestRunner`, `MarketReplay`)
- [x] Synthetic market data generation
- [x] Strategy config dry-run mode support
- [x] Deployment guide created

## ⏳ Phase 3: Docker Integration

- [ ] Test `docker build` locally
- [ ] Push image to Docker Hub (optional)
- [ ] Verify `docker-compose up` works with dummy env

## ⏳ Phase 4: VPS Deployment

- [ ] Provision Contabo VPS with Docker
- [ ] Install Dokploy
- [ ] Connect GitHub repo to Dokploy
- [ ] Configure environment in Dokploy
- [ ] Deploy and verify `/health` endpoint
- [ ] Monitor logs and test trade flow

## ⏳ Phase 5: Telegram Notifications (Optional)

- [ ] Create Telegram bot with @BotFather
- [ ] Get bot token and chat ID
- [ ] Add to `.env`
- [ ] Test alert reception

## ⏳ Phase 6: Real Polymarket Integration

- [ ] Setup wallet with `ethers.js`
- [ ] Implement EIP712 order signing for CLOB
- [ ] Switch from mock `waitForFill()` to real order execution
- [ ] Testnet validation before mainnet

## ⏳ Phase 7: OpenClaw Commands (Optional)

- [ ] Setup OpenClaw SDK
- [ ] Implement `kill_switch` command
- [ ] Implement `manual_audit` command
- [ ] Test Telegram command handler

---

## Run Node Tests

```bash
# 1. Verify build
npm run build

# 2. Test backtest with synthetic data
npm run backtest -- --mode synthetic --tokens 5 --events 50

# 3. Test dry-run mode locally
npm run dev
# Ctrl+C to stop after 30 seconds

# 4. Check Docker build
docker build -t ai-contrarian-bot:local .
```

## Deploy Quick Steps

```bash
# On VPS (with Dokploy):
1. Create Docker project in Dokploy dashboard
2. Add environment variables
3. Deploy from GitHub
4. Verify health endpoint
5. Monitor logs in dashboard
```
