import { DeepSeekBrain, ProbabilityAnalysisResult } from '../services/DeepSeekBrain';
import { StrategyReflector, TradeContext } from '../services/StrategyReflector';
import { MarketContextEvent } from '../services/SignalScanner';
import { MarketReplay, MarketSnapshot, BacktestConfig } from './market-replay';

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
  trades: (TradeContext & { aiProbability: number })[];
}

export interface BacktestTradeSimulation {
  tokenId: string;
  entryPrice: number;
  aiProbability: number;
  marketPrice: number;
  winProbability: number; // AI vs market diff
  actualResult: 'win' | 'loss';
  profitAmount: number;
}

export class BacktestRunner {
  private brain: DeepSeekBrain;
  private reflector: StrategyReflector;
  private replay: MarketReplay;
  private budget: number;
  private baseUnitSize: number;
  private marginOfSafety: number;
  private trades: (TradeContext & { aiProbability: number })[] = [];
  private budgetHistory: number[] = [];
  private tradeHistory: TradeContext[] = [];

  constructor(config: BacktestConfig) {
    this.brain = new DeepSeekBrain();
    this.reflector = new StrategyReflector();
    this.replay = new MarketReplay(config);
    this.budget = config.initialBudget;
    this.baseUnitSize = config.baseUnitSize;
    this.marginOfSafety = config.marginOfSafety;
    this.budgetHistory.push(this.budget);
  }

  /**
   * Load market snapshots and execute backtest
   */
  public async runBacktest(snapshots: MarketSnapshot[]): Promise<BacktestResult> {
    console.log(`[BacktestRunner] Starting backtest with ${snapshots.length} market snapshots`);
    
    this.replay.loadSnapshots(snapshots);
    
    // Wire up event listeners
    this.replay.on('market_snapshot', async (event: MarketContextEvent) => {
      await this.handleMarketSnapshot(event);
    });

    this.replay.on('replay_completed', () => {
      console.log(`[BacktestRunner] Replay completed. Analyzing results...`);
    });

    // Start the replay
    await this.replay.start();

    // Generate and return results
    return this.generateResults();
  }

  /**
   * Generate synthetic data and run backtest
   */
  public async runWithSyntheticData(
    tokenCount: number = 5,
    eventCount: number = 100
  ): Promise<BacktestResult> {
    console.log(`[BacktestRunner] Generating synthetic market data...`);
    
    this.replay.generateSyntheticData(tokenCount, eventCount);
    
    this.replay.on('market_snapshot', async (event: MarketContextEvent) => {
      await this.handleMarketSnapshot(event);
    });

    await this.replay.start();
    return this.generateResults();
  }

  private async handleMarketSnapshot(event: MarketContextEvent): Promise<void> {
    try {
      // Fetch lessons learned
      const lessons = await this.reflector.getLessonsLearned();

      // Analyze with brain
      const analysis = await this.brain.analyzeProbability(
        event.tokenId,
        event.currentPrice,
        event.recentVolume,
        event.isWhaleBuying,
        lessons
      );

      // Check if trade signal exists
      if (
        (analysis.fair_value_probability - event.currentPrice) > this.marginOfSafety &&
        this.budget >= this.baseUnitSize
      ) {
        // Execute simulated trade
        const result = await this.simulateTrade(event, analysis);
        
        // Update budget based on result
        if (result.win) {
          this.budget += this.baseUnitSize + result.profitAmount;
        } else {
          this.budget -= result.profitAmount; // Already deducted unit size
        }

        this.budgetHistory.push(this.budget);

        // Store trade for analysis
        const tradeWithContext: TradeContext & { aiProbability: number } = {
          ...result,
          aiProbability: analysis.fair_value_probability,
        };
        this.trades.push(tradeWithContext);
        this.tradeHistory.push(result);

        // Run active learning
        if (this.tradeHistory.length > 0) {
          await this.reflector.analyze([result]);
        }
      }
    } catch (error) {
      console.error('[BacktestRunner] Error handling snapshot:', error);
    }
  }

  private async simulateTrade(
    event: MarketContextEvent,
    analysis: ProbabilityAnalysisResult
  ): Promise<TradeContext> {
    const tradeId = `backtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate trade outcome: win if market price is below AI probability
    const aiProbThreshold = Math.max(0.5, analysis.fair_value_probability - 0.05);
    const win = event.currentPrice < aiProbThreshold;
    const profitAmount = win ? this.baseUnitSize * 0.8 : 0;

    // Store trade before updating budget
    this.budget -= this.baseUnitSize;

    return {
      tradeId,
      win,
      profitAmount,
      context: event,
      predictedProbability: analysis.fair_value_probability,
    };
  }

  private generateResults(): BacktestResult {
    const totalTrades = this.trades.length;
    const wins = this.trades.filter((t) => t.win).length;
    const losses = totalTrades - wins;
    const winRate = totalTrades === 0 ? 0 : wins / totalTrades;
    const totalProfit = this.trades.reduce((sum, t) => sum + t.profitAmount, 0);
    const finalBudget = this.budget;
    const maxDrawdown = this.calculateMaxDrawdown();
    const averageTradeSize =
      totalTrades === 0
        ? 0
        : this.trades.reduce((sum, t) => sum + this.baseUnitSize, 0) / totalTrades;

    const startingBudget = this.budgetHistory[0];

    console.log(`\n========== BACKTEST RESULTS ==========`);
    console.log(`Total Trades: ${totalTrades}`);
    console.log(`Wins: ${wins}, Losses: ${losses}`);
    console.log(`Win Rate: ${(winRate * 100).toFixed(2)}%`);
    console.log(`Starting Budget: $${startingBudget.toFixed(2)}`);
    console.log(`Final Budget: $${finalBudget.toFixed(2)}`);
    console.log(`Total Profit: $${totalProfit.toFixed(2)}`);
    console.log(`ROI: ${(((finalBudget - startingBudget) / startingBudget) * 100).toFixed(2)}%`);
    console.log(`Max Drawdown: ${(maxDrawdown * 100).toFixed(2)}%`);
    console.log(`======================================\n`);

    return {
      totalTrades,
      wins,
      losses,
      winRate,
      totalProfit,
      finalBudget,
      maxDrawdown,
      averageTradeSize,
      startingBudget,
      trades: this.trades,
    };
  }

  private calculateMaxDrawdown(): number {
    if (this.budgetHistory.length < 2) return 0;

    let maxDrawdown = 0;
    let peak = this.budgetHistory[0];

    for (const budget of this.budgetHistory) {
      if (budget > peak) {
        peak = budget;
      }
      const drawdown = (peak - budget) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }
}
