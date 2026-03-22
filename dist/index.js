"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenClawGateway = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const SignalScanner_1 = require("./services/SignalScanner");
const DeepSeekBrain_1 = require("./services/DeepSeekBrain");
const BankrollManager_1 = require("./services/BankrollManager");
const StrategyReflector_1 = require("./services/StrategyReflector");
const TelegramNotifier_1 = require("./services/TelegramNotifier");
dotenv_1.default.config();
class OpenClawGateway {
    registerSkill(skill) {
        console.log(`Registered OpenClaw Skill: ${skill.name}`);
    }
    async initialize() {
        console.log('OpenClaw Gateway initialized');
    }
}
exports.OpenClawGateway = OpenClawGateway;
class MainOrchestrator {
    constructor() {
        this.marginOfSafety = 0.10;
        // Now tracks trades with context to feed into StrategyReflector
        this.tradeHistory = [];
        this.brain = new DeepSeekBrain_1.DeepSeekBrain();
        this.reflector = new StrategyReflector_1.StrategyReflector();
        this.gateway = new OpenClawGateway();
    }
    async start() {
        console.log('Starting AI Contrarian Bot Orchestrator...');
        // 0. Load strategy config and initialize config-dependent services
        const config = await this.reflector.getConfig();
        console.log(`[CONFIG] Loaded strategy config:`, config);
        this.scanner = new SignalScanner_1.SignalScanner({
            whaleThreshold: config.whale_threshold,
            panicPriceThreshold: config.panic_price_threshold,
        });
        this.bankroll = new BankrollManager_1.BankrollManager(config.starting_budget, config.base_unit_size);
        this.marginOfSafety = config.margin_of_safety;
        // 1. Initialize OpenClaw Gateway
        await this.gateway.initialize();
        // 2. Wrap the loop in an OpenClaw Skill handler
        this.gateway.registerSkill({
            name: 'ContrarianAudit',
            description: 'Audit current market panics and override bot strategy manually from Telegram.',
            handler: async (context) => {
                console.log('Manual audit triggered via OpenClaw:', context);
            }
        });
        // 3. Start WSS Listener
        this.scanner.on('market_opportunity', async (event) => {
            await this.handleMarketOpportunity(event);
        });
        await this.scanner.start();
        this.setupGracefulShutdown();
        const app = (0, express_1.default)();
        app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Health check server listening on port ${port}`);
        });
        await TelegramNotifier_1.telegramNotifier.notifyBotStarted();
    }
    async handleMarketOpportunity(event) {
        console.log(`[EVENT] Market opportunity detected for ${event.tokenId} at $${event.currentPrice}. Whale Buying: ${event.isWhaleBuying}`);
        await TelegramNotifier_1.telegramNotifier.notifyPanicDetected(event.tokenId, event.currentPrice, event.recentVolume);
        try {
            // Fetch historical lessons
            const lessons = await this.reflector.getLessonsLearned();
            // 1. Call DeepSeek-R1 Brain
            const analysis = await this.brain.analyzeProbability(event.tokenId, event.currentPrice, event.recentVolume, event.isWhaleBuying, lessons);
            console.log(`[ANALYSIS] Fair Value Probability: ${(analysis.fair_value_probability * 100).toFixed(1)}%. Reasoning: ${analysis.reasoning}`);
            // 2. Execution Gate: Compare predicted true probability against current market price (implied probability)
            if ((analysis.fair_value_probability - event.currentPrice) > this.marginOfSafety && this.bankroll.canAfford()) {
                console.log(`[EXECUTE] Probabilistic Edge detected (margin > ${this.marginOfSafety}). Placing trade...`);
                const unitSize = await this.reflector.getConfig().then(c => c.base_unit_size);
                // 3. Execute Trade
                const result = await this.bankroll.executeTrade(event.tokenId, analysis.fair_value_probability);
                await TelegramNotifier_1.telegramNotifier.notifyTradeExecuted(event.tokenId, event.currentPrice, unitSize, analysis.fair_value_probability);
                this.tradeHistory.push({
                    ...result,
                    context: event,
                    predictedProbability: analysis.fair_value_probability
                });
                if (result.win) {
                    await TelegramNotifier_1.telegramNotifier.notifyTradeWon(event.tokenId, result.profitAmount);
                }
                else {
                    await TelegramNotifier_1.telegramNotifier.notifyTradeLost(event.tokenId, result.profitAmount);
                }
                // 4. Feedback Loop
                await this.reflector.analyze(this.tradeHistory);
            }
            else {
                console.log(`[SKIP] Trade skipped. Insufficient probabilistic edge or bankroll.`);
            }
        }
        catch (error) {
            console.error(`[ERROR] Failed to handle market opportunity:`, error);
            await TelegramNotifier_1.telegramNotifier.notifyError(error instanceof Error ? error.message : String(error), `Market opportunity handler failed for ${event.tokenId}`);
        }
    }
    setupGracefulShutdown() {
        const shutdown = async () => {
            console.log('\nReceived kill signal, shutting down gracefully...');
            this.scanner.stop();
            await TelegramNotifier_1.telegramNotifier.notifyBotStopped();
            console.log('Cleanup complete. Exiting process.');
            process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }
}
// Bootstrap
if (require.main === module) {
    const orchestrator = new MainOrchestrator();
    orchestrator.start().catch((err) => {
        console.error('Fatal error during startup:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map