"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyReflector = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const openai_1 = __importDefault(require("openai"));
class StrategyReflector {
    constructor() {
        this.config = null;
        this.configPath = path_1.default.resolve(__dirname, '../config/strategy_config.json');
        this.lessonsPath = path_1.default.resolve(__dirname, '../config/strategy_lessons.json');
        this.openai = new openai_1.default({
            baseURL: 'https://api.deepseek.com',
            apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY,
        });
    }
    async loadConfig() {
        if (!this.config) {
            try {
                const data = await promises_1.default.readFile(this.configPath, 'utf8');
                this.config = JSON.parse(data);
            }
            catch (error) {
                // Default config if missing
                this.config = {
                    consecutive_losses: 0,
                    confidence_threshold: 8,
                    base_unit_size: 5,
                    volatility_multiplier: 1,
                    active_learning: true,
                    whale_threshold: 10000,
                    panic_price_threshold: 0.25,
                    margin_of_safety: 0.10,
                    starting_budget: 21.0
                };
            }
        }
        return this.config;
    }
    async getConfig() {
        return this.loadConfig();
    }
    async saveConfig(config) {
        await promises_1.default.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf8');
        this.config = config;
    }
    async getLessonsLearned() {
        try {
            const data = await promises_1.default.readFile(this.lessonsPath, 'utf8');
            const lessons = JSON.parse(data);
            // Return the last 5 lessons to keep the prompt context reasonable
            return lessons.slice(-5).join("\\n- ");
        }
        catch (error) {
            // Return empty if no lessons yet
            return "No past lessons available.";
        }
    }
    async saveLesson(lesson) {
        let lessons = [];
        try {
            const data = await promises_1.default.readFile(this.lessonsPath, 'utf8');
            lessons = JSON.parse(data);
        }
        catch (error) {
            // Ignore, file will be created
        }
        lessons.push(lesson);
        await promises_1.default.writeFile(this.lessonsPath, JSON.stringify(lessons, null, 2), 'utf8');
    }
    async generatePostMortem(trade) {
        const prompt = `
A trade was made on ${trade.context.tokenId}.
Context at time of trade: Price was $${trade.context.currentPrice}, Whales were buying: ${trade.context.isWhaleBuying}.
We predicted a probability of ${(trade.predictedProbability * 100).toFixed(1)}%.
The trade resulted in a ${trade.win ? 'WIN' : 'LOSS'}.

Write a one-sentence "Lesson Learned" summarizing why this probability assessment was either correct or incorrect based on the outcome, to be used for future predictions.
`;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'deepseek-reasoner',
                messages: [{ role: 'user', content: prompt }]
            });
            return response.choices[0].message.content?.trim() || "Observed trade outcome without clear lesson.";
        }
        catch (error) {
            console.error("Failed to generate post-mortem", error);
            return `Trade ${trade.win ? 'won' : 'lost'} when buying at ${trade.context.currentPrice} with whale presence: ${trade.context.isWhaleBuying}.`;
        }
    }
    async analyze(tradeHistory) {
        const config = await this.loadConfig();
        if (!config.active_learning) {
            console.log('Active learning is disabled. Skipping reflection.');
            return;
        }
        if (tradeHistory.length === 0)
            return;
        const lastTrade = tradeHistory[tradeHistory.length - 1];
        console.log(`Analyzing outcome of trade ${lastTrade.tradeId} (Win: ${lastTrade.win})`);
        // 1. Generate and save the LLM post-mortem
        const lesson = await this.generatePostMortem(lastTrade);
        await this.saveLesson(lesson);
        console.log(`Lesson Learned Saved: "${lesson}"`);
        // 2. Adjust Risk Config based on outcome
        if (lastTrade.win) {
            config.consecutive_losses = 0;
        }
        else {
            config.consecutive_losses += 1;
            // Dynamic unit sizing
            if (config.consecutive_losses >= 3) {
                config.base_unit_size = Math.max(1.0, config.base_unit_size * 0.8);
                console.log('Three consecutive losses: reducing position size.');
            }
        }
        await this.saveConfig(config);
        console.log('Strategy config patched and saved.');
    }
}
exports.StrategyReflector = StrategyReflector;
//# sourceMappingURL=StrategyReflector.js.map