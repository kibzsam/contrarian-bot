"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacktestRunner = void 0;
const DeepSeekBrain_1 = require("../services/DeepSeekBrain");
const StrategyReflector_1 = require("../services/StrategyReflector");
const market_replay_1 = require("./market-replay");
class BacktestRunner {
    constructor(config) {
        this.trades = [];
        this.budgetHistory = [];
        this.tradeHistory = [];
        this.brain = new DeepSeekBrain_1.DeepSeekBrain();
        this.reflector = new StrategyReflector_1.StrategyReflector();
        this.replay = new market_replay_1.MarketReplay(config);
        this.budget = config.initialBudget;
        this.baseUnitSize = config.baseUnitSize;
        this.marginOfSafety = config.marginOfSafety;
        this.budgetHistory.push(this.budget);
    }
    /**
     * Load market snapshots and execute backtest
     */
    async runBacktest(snapshots) {
        console.log(`[BacktestRunner] Starting backtest with ${snapshots.length} market snapshots`);
        this.replay.loadSnapshots(snapshots);
        // Wire up event listeners
        this.replay.on('market_snapshot', async (event) => {
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
    async runWithSyntheticData(tokenCount = 5, eventCount = 100) {
        console.log(`[BacktestRunner] Generating synthetic market data...`);
        this.replay.generateSyntheticData(tokenCount, eventCount);
        this.replay.on('market_snapshot', async (event) => {
            await this.handleMarketSnapshot(event);
        });
        await this.replay.start();
        return this.generateResults();
    }
    async handleMarketSnapshot(event) {
        try {
            // Fetch lessons learned
            const lessons = await this.reflector.getLessonsLearned();
            // Analyze with brain
            const analysis = await this.brain.analyzeProbability(event.tokenId, event.currentPrice, event.recentVolume, event.isWhaleBuying, lessons);
            // Check if trade signal exists
            if ((analysis.fair_value_probability - event.currentPrice) > this.marginOfSafety &&
                this.budget >= this.baseUnitSize) {
                // Execute simulated trade
                const result = await this.simulateTrade(event, analysis);
                // Update budget based on result
                if (result.win) {
                    this.budget += this.baseUnitSize + result.profitAmount;
                }
                else {
                    this.budget -= result.profitAmount; // Already deducted unit size
                }
                this.budgetHistory.push(this.budget);
                // Store trade for analysis
                const tradeWithContext = {
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
        }
        catch (error) {
            console.error('[BacktestRunner] Error handling snapshot:', error);
        }
    }
    async simulateTrade(event, analysis) {
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
    generateResults() {
        const totalTrades = this.trades.length;
        const wins = this.trades.filter((t) => t.win).length;
        const losses = totalTrades - wins;
        const winRate = totalTrades === 0 ? 0 : wins / totalTrades;
        const totalProfit = this.trades.reduce((sum, t) => sum + t.profitAmount, 0);
        const finalBudget = this.budget;
        const maxDrawdown = this.calculateMaxDrawdown();
        const averageTradeSize = totalTrades === 0
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
    calculateMaxDrawdown() {
        if (this.budgetHistory.length < 2)
            return 0;
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
exports.BacktestRunner = BacktestRunner;
//# sourceMappingURL=backtest-runner.js.map