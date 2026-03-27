export interface TradeResult {
    tradeId: string;
    win: boolean;
    profitAmount: number;
    entryPrice?: number;
}
export interface OpenPosition {
    tradeId: string;
    tokenId: string;
    entryPrice: number;
    quantity: number;
    entryTime: number;
}
export declare class BankrollManager {
    private budget;
    private unitSize;
    private clobClient;
    private openPositions;
    private takeProfitPercent;
    constructor(startingBudget: number, unitSize: number);
    canAfford(): boolean;
    executeTrade(tokenId: string, confidenceScore: number): Promise<TradeResult>;
    /**
     * Monitor open positions for take-profit at +2.1%
     * This should be called periodically by the orchestrator
     */
    monitorTakeProfit(): Promise<void>;
    /**
     * Get current price for a token (simulated for now)
     */
    private getCurrentPrice;
    /**
     * Execute limit sell at current price
     */
    private executeLimitSell;
    /**
     * Get count of open positions
     */
    getOpenPositionCount(): number;
    /**
     * Get all open positions
     */
    getOpenPositions(): OpenPosition[];
    private waitForFill;
}
//# sourceMappingURL=BankrollManager.d.ts.map