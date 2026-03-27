import { EventEmitter } from 'events';
export interface MarketContextEvent {
    tokenId: string;
    currentPrice: number;
    recentVolume: number;
    isWhaleBuying: boolean;
    priceDropPercent?: number;
}
export interface ScannerConfig {
    whaleThreshold: number;
    panicPriceThreshold: number;
    wssUrl?: string;
}
export declare class SignalScanner extends EventEmitter {
    private ws;
    private polymarketClobWsUrl;
    private pingInterval;
    private volumeTracker;
    private whaleThreshold;
    private panicPriceThreshold;
    private priceHistory;
    private readonly PRICE_HISTORY_WINDOW_MS;
    private readonly PRICE_DROP_THRESHOLD;
    private monitoredTokens;
    constructor(config: ScannerConfig);
    start(): Promise<void>;
    private fetchActiveTokens;
    private connect;
    private subscribeToMarkets;
    private handleMessage;
    /**
     * Track price history for a token
     */
    private trackPriceHistory;
    /**
     * Calculate price drop percentage over the last 60 minutes
     * Returns null if insufficient data
     */
    private calculatePriceDropPercent;
    private clearPing;
    stop(): void;
}
//# sourceMappingURL=SignalScanner.d.ts.map