import { EventEmitter } from 'events';
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
    speed: number;
}
export declare class MarketReplay extends EventEmitter {
    private snapshots;
    private currentIndex;
    private isRunning;
    private config;
    private replayTimer;
    constructor(config: BacktestConfig);
    /**
     * Load historical market snapshots from array
     */
    loadSnapshots(snapshots: MarketSnapshot[]): void;
    /**
     * Load snapshots from JSON file
     */
    loadFromFile(filePath: string): Promise<void>;
    /**
     * Generate synthetic market data for testing
     */
    generateSyntheticData(tokenCount?: number, eventCount?: number): void;
    /**
     * Start replaying market events
     */
    start(): Promise<void>;
    /**
     * Stop the replay
     */
    stop(): void;
    /**
     * Get current replay progress
     */
    getProgress(): {
        current: number;
        total: number;
        percentage: number;
    };
    private runReplay;
    private delay;
}
//# sourceMappingURL=market-replay.d.ts.map