export interface TradeResult {
    tradeId: string;
    win: boolean;
    profitAmount: number;
}
export declare class BankrollManager {
    private budget;
    private unitSize;
    private clobClient;
    constructor(startingBudget: number, unitSize: number);
    canAfford(): boolean;
    executeTrade(tokenId: string, confidenceScore: number): Promise<TradeResult>;
    private waitForFill;
}
//# sourceMappingURL=BankrollManager.d.ts.map