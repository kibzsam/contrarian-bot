import { TradeContext } from '../services/StrategyReflector';
import { MarketSnapshot, BacktestConfig } from './market-replay';
export interface BacktestResult {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalProfit: number;
    finalBudget: number;
    maxDrawdown: number;
    averageTradeSize: number;
    startingBudget: number;
    trades: (TradeContext & {
        aiProbability: number;
    })[];
}
export interface BacktestTradeSimulation {
    tokenId: string;
    entryPrice: number;
    aiProbability: number;
    marketPrice: number;
    winProbability: number;
    actualResult: 'win' | 'loss';
    profitAmount: number;
}
export declare class BacktestRunner {
    private brain;
    private reflector;
    private replay;
    private budget;
    private baseUnitSize;
    private marginOfSafety;
    private trades;
    private budgetHistory;
    private tradeHistory;
    constructor(config: BacktestConfig);
    /**
     * Load market snapshots and execute backtest
     */
    runBacktest(snapshots: MarketSnapshot[]): Promise<BacktestResult>;
    /**
     * Generate synthetic data and run backtest
     */
    runWithSyntheticData(tokenCount?: number, eventCount?: number): Promise<BacktestResult>;
    private handleMarketSnapshot;
    private simulateTrade;
    private generateResults;
    private calculateMaxDrawdown;
}
//# sourceMappingURL=backtest-runner.d.ts.map