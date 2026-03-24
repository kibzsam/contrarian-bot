import { EventEmitter } from 'events';
import { MarketContextEvent } from '../services/SignalScanner';

export interface MarketSnapshot {
  timestamp: number;
  tokenId: string;
  price: number;
  volume: number;
  isWhaleBuying: boolean;
}

export interface BacktestConfig {
  startDate: Date;
  endDate: Date;
  initialBudget: number;
  baseUnitSize: number;
  whaleThreshold: number;
  panicPriceThreshold: number;
  marginOfSafety: number;
  speed: number; // 1 = real-time, 10 = 10x faster
}

export class MarketReplay extends EventEmitter {
  private snapshots: MarketSnapshot[] = [];
  private currentIndex: number = 0;
  private isRunning: boolean = false;
  private config: BacktestConfig;
  private replayTimer: NodeJS.Timeout | null = null;

  constructor(config: BacktestConfig) {
    super();
    this.config = config;
  }

  /**
   * Load historical market snapshots from array
   */
  public loadSnapshots(snapshots: MarketSnapshot[]): void {
    this.snapshots = snapshots.sort((a, b) => a.timestamp - b.timestamp);
    console.log(`[MarketReplay] Loaded ${this.snapshots.length} market snapshots`);
  }

  /**
   * Load snapshots from JSON file
   */
  public async loadFromFile(filePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(filePath, 'utf8');
      const snapshots = JSON.parse(data) as MarketSnapshot[];
      this.loadSnapshots(snapshots);
    } catch (error) {
      throw new Error(`Failed to load market data from ${filePath}: ${error}`);
    }
  }

  /**
   * Generate synthetic market data for testing
   */
  public generateSyntheticData(tokenCount: number = 5, eventCount: number = 100): void {
    const snapshots: MarketSnapshot[] = [];
    const tokens = Array.from({ length: tokenCount }, (_, i) =>
      `0x${i.toString().padStart(64, '0')}`
    );

    let currentTimestamp = this.config.startDate.getTime();
    const endTimestamp = this.config.endDate.getTime();
    const timeStep = (endTimestamp - currentTimestamp) / eventCount;

    for (let i = 0; i < eventCount; i++) {
      const tokenId = tokens[Math.floor(Math.random() * tokens.length)];
      const price = Math.random() * 0.9 + 0.1; // 0.1 to 1.0
      const volume = Math.random() * 20000 + 1000;
      const isWhaleBuying =
        price < this.config.panicPriceThreshold &&
        volume > this.config.whaleThreshold;

      snapshots.push({
        timestamp: Math.floor(currentTimestamp),
        tokenId,
        price,
        volume,
        isWhaleBuying,
      });

      currentTimestamp += timeStep;
    }

    this.loadSnapshots(snapshots);
  }

  /**
   * Start replaying market events
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[MarketReplay] Replay already running');
      return;
    }

    if (this.snapshots.length === 0) {
      throw new Error('No market snapshots loaded. Call loadSnapshots() first.');
    }

    this.isRunning = true;
    this.currentIndex = 0;
    this.emit('replay_started', {
      totalSnapshots: this.snapshots.length,
      startDate: new Date(this.snapshots[0].timestamp),
      endDate: new Date(this.snapshots[this.snapshots.length - 1].timestamp),
    });

    await this.runReplay();
  }

  /**
   * Stop the replay
   */
  public stop(): void {
    this.isRunning = false;
    if (this.replayTimer) {
      clearTimeout(this.replayTimer);
      this.replayTimer = null;
    }
    this.emit('replay_stopped', { completedSnapshots: this.currentIndex });
  }

  /**
   * Get current replay progress
   */
  public getProgress(): { current: number; total: number; percentage: number } {
    const total = this.snapshots.length;
    const percentage = total === 0 ? 0 : (this.currentIndex / total) * 100;
    return { current: this.currentIndex, total, percentage };
  }

  private async runReplay(): Promise<void> {
    while (this.isRunning && this.currentIndex < this.snapshots.length) {
      const snapshot = this.snapshots[this.currentIndex];

      // Convert snapshot to MarketContextEvent
      const event: MarketContextEvent = {
        tokenId: snapshot.tokenId,
        currentPrice: snapshot.price,
        recentVolume: snapshot.volume,
        isWhaleBuying: snapshot.isWhaleBuying,
      };

      this.emit('market_snapshot', event);

      // Calculate delay based on speed multiplier
      const nextSnapshot = this.snapshots[this.currentIndex + 1];
      if (nextSnapshot) {
        const timeDiff = nextSnapshot.timestamp - snapshot.timestamp;
        const delayMs = Math.max(100, timeDiff / this.config.speed);
        await this.delay(delayMs);
      }

      this.currentIndex++;
    }

    if (this.isRunning) {
      this.isRunning = false;
      this.emit('replay_completed', { totalSnapshots: this.snapshots.length });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.replayTimer = setTimeout(resolve, ms);
    });
  }
}
