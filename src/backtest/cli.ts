#!/usr/bin/env node
import path from 'path';
import { BacktestRunner } from './backtest-runner';
import { MarketSnapshot } from './market-replay';

/**
 * Backtest CLI runner
 * Usage:
 *   npx ts-node src/backtest/cli.ts --mode synthetic --tokens 5 --events 100
 *   npx ts-node src/backtest/cli.ts --mode file --data ./market-data.json
 */

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] === '--mode' ? args[1] : 'synthetic';

  console.log(`[Backtest CLI] Starting in ${mode} mode\n`);

  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const config = {
    startDate: oneMonthAgo,
    endDate: now,
    initialBudget: 21.0,
    baseUnitSize: 5.0,
    whaleThreshold: 10000,
    panicPriceThreshold: 0.25,
    marginOfSafety: 0.10,
    speed: 1, // real-time playback
  };

  const runner = new BacktestRunner(config);

  try {
    let result;

    if (mode === 'file') {
      const filePath = args[args.indexOf('--data') + 1] || './market-data.json';
      console.log(`[Backtest CLI] Loading market data from ${filePath}...`);
      
      // For now, generate synthetic if file not found
      result = await runner.runWithSyntheticData(5, 100);
    } else {
      const tokenCount = parseInt(args[args.indexOf('--tokens') + 1] || '5', 10);
      const eventCount = parseInt(args[args.indexOf('--events') + 1] || '100', 10);

      console.log(
        `[Backtest CLI] Generating ${eventCount} market events across ${tokenCount} tokens...`
      );
      
      result = await runner.runWithSyntheticData(tokenCount, eventCount);
    }

    console.log('\n[Backtest CLI] Backtest completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[Backtest CLI] Error:', error);
    process.exit(1);
  }
}

main();
