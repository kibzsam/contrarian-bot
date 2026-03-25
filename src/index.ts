import dotenv from 'dotenv';
import express from 'express';
import { SignalScanner, MarketContextEvent } from './services/SignalScanner';
import { DeepSeekBrain } from './services/DeepSeekBrain';
import { BankrollManager, TradeResult } from './services/BankrollManager';
import { StrategyReflector } from './services/StrategyReflector';
import { telegramNotifier } from './services/TelegramNotifier';
import { initializeDatabase } from './db/database';
import dashboardRoutes from './routes/dashboard';
import marketRoutes from './routes/markets';
import backtestRoutes from './routes/backtest';

dotenv.config();


// Assuming OpenClaw interfaces from a polybased SDK or equivalent
export interface OpenClawSkill {
  name: string;
  description: string;
  handler: (context: any) => Promise<void>;
}

export class OpenClawGateway {
  public registerSkill(skill: OpenClawSkill): void {
    console.log(`Registered OpenClaw Skill: ${skill.name}`);
  }
  public async initialize(): Promise<void> {
    console.log('OpenClaw Gateway initialized');
  }
}

class MainOrchestrator {
  private scanner!: SignalScanner;
  private brain: DeepSeekBrain;
  private bankroll!: BankrollManager;
  private reflector: StrategyReflector;
  private gateway: OpenClawGateway;
  private marginOfSafety: number = 0.10;
  
  // Now tracks trades with context to feed into StrategyReflector
  private tradeHistory: (TradeResult & { context: MarketContextEvent, predictedProbability: number })[] = [];
  
  constructor() {
    this.brain = new DeepSeekBrain();
    this.reflector = new StrategyReflector();
    this.gateway = new OpenClawGateway();
  }

  public async start() {
    console.log('Starting AI Contrarian Bot Orchestrator...');
    
    // 0. Load strategy config and initialize config-dependent services
    const config = await this.reflector.getConfig();
    console.log(`[CONFIG] Loaded strategy config:`, config);

    this.scanner = new SignalScanner({
      whaleThreshold: config.whale_threshold,
      panicPriceThreshold: config.panic_price_threshold,
    });
    this.bankroll = new BankrollManager(config.starting_budget, config.base_unit_size);
    this.marginOfSafety = config.margin_of_safety;

    // 1. Initialize OpenClaw Gateway
    await this.gateway.initialize();

    // 2. Wrap the loop in an OpenClaw Skill handler
    this.gateway.registerSkill({
      name: 'ContrarianAudit',
      description: 'Audit current market panics and override bot strategy manually from Telegram.',
      handler: async (context: any) => {
        console.log('Manual audit triggered via OpenClaw:', context);
      }
    });

    // 3. Start WSS Listener
    this.scanner.on('market_opportunity', async (event: MarketContextEvent) => {
      await this.handleMarketOpportunity(event);
    });
    await this.scanner.start();

    this.setupGracefulShutdown();
    
    // Initialize database
    await initializeDatabase();
    
    const app = express();
    
    // Middleware
    app.use(express.json());
    app.use(express.static('../dashboard/dist'));
    
    // API Routes
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/markets', marketRoutes);
    app.use('/api/backtest', backtestRoutes);
    
    // Health check
    app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
    
    // Fallback to dashboard for SPA routing
    app.get('*', (req, res) => {
      res.sendFile('../dashboard/dist/index.html', { root: __dirname });
    });
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`📊 Dashboard: http://localhost:${port}`);
      console.log(`🏥 Health check: http://localhost:${port}/health`);
    });

    await telegramNotifier.notifyBotStarted();
  }

  private async handleMarketOpportunity(event: MarketContextEvent) {
    console.log(`[EVENT] Market opportunity detected for ${event.tokenId} at $${event.currentPrice}. Whale Buying: ${event.isWhaleBuying}`);
    
    await telegramNotifier.notifyPanicDetected(event.tokenId, event.currentPrice, event.recentVolume);
    
    try {
      // Fetch historical lessons
      const lessons = await this.reflector.getLessonsLearned();

      // 1. Call DeepSeek-R1 Brain
      const analysis = await this.brain.analyzeProbability(
         event.tokenId, 
         event.currentPrice, 
         event.recentVolume, 
         event.isWhaleBuying,
         lessons
      );
      
      console.log(`[ANALYSIS] Fair Value Probability: ${(analysis.fair_value_probability * 100).toFixed(1)}%. Reasoning: ${analysis.reasoning}`);

      // 2. Execution Gate: Compare predicted true probability against current market price (implied probability)
      if ((analysis.fair_value_probability - event.currentPrice) > this.marginOfSafety && this.bankroll.canAfford()) {
        console.log(`[EXECUTE] Probabilistic Edge detected (margin > ${this.marginOfSafety}). Placing trade...`);
        
        const unitSize = await this.reflector.getConfig().then(c => c.base_unit_size);
        
        // 3. Execute Trade
        const result = await this.bankroll.executeTrade(event.tokenId, analysis.fair_value_probability);
        
        await telegramNotifier.notifyTradeExecuted(
          event.tokenId,
          event.currentPrice,
          unitSize,
          analysis.fair_value_probability
        );
        
        this.tradeHistory.push({
           ...result,
           context: event,
           predictedProbability: analysis.fair_value_probability
        });

        if (result.win) {
          await telegramNotifier.notifyTradeWon(event.tokenId, result.profitAmount);
        } else {
          await telegramNotifier.notifyTradeLost(event.tokenId, result.profitAmount);
        }

        // 4. Feedback Loop
        await this.reflector.analyze(this.tradeHistory);
      } else {
        console.log(`[SKIP] Trade skipped. Insufficient probabilistic edge or bankroll.`);
      }
    } catch (error) {
       console.error(`[ERROR] Failed to handle market opportunity:`, error);
       await telegramNotifier.notifyError(
         error instanceof Error ? error.message : String(error),
         `Market opportunity handler failed for ${event.tokenId}`
       );
    }
  }

  private setupGracefulShutdown() {
    const shutdown = async () => {
      console.log('\nReceived kill signal, shutting down gracefully...');
      this.scanner.stop();
      await telegramNotifier.notifyBotStopped();
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
