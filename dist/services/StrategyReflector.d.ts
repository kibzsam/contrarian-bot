import { TradeResult } from './BankrollManager';
import { MarketContextEvent } from './SignalScanner';
export interface StrategyConfig {
    consecutive_losses: number;
    confidence_threshold: number;
    base_unit_size: number;
    volatility_multiplier: number;
    active_learning: boolean;
    whale_threshold: number;
    panic_price_threshold: number;
    margin_of_safety: number;
    starting_budget: number;
}
export interface TradeContext extends TradeResult {
    context: MarketContextEvent;
    predictedProbability: number;
}
export declare class StrategyReflector {
    private configPath;
    private lessonsPath;
    private config;
    private openai;
    constructor();
    private loadConfig;
    getConfig(): Promise<StrategyConfig>;
    private saveConfig;
    getLessonsLearned(): Promise<string>;
    private saveLesson;
    private generatePostMortem;
    analyze(tradeHistory: TradeContext[]): Promise<void>;
}
//# sourceMappingURL=StrategyReflector.d.ts.map