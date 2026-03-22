import { EventEmitter } from 'events';
export interface MarketContextEvent {
    tokenId: string;
    currentPrice: number;
    recentVolume: number;
    isWhaleBuying: boolean;
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
    private monitoredTokens;
    constructor(config: ScannerConfig);
    start(): Promise<void>;
    private fetchActiveTokens;
    private connect;
    private subscribeToMarkets;
    private handleMessage;
    private clearPing;
    stop(): void;
}
//# sourceMappingURL=SignalScanner.d.ts.map