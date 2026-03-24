"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepSeekBrain = void 0;
const openai_1 = __importDefault(require("openai"));
class DeepSeekBrain {
    constructor() {
        this.openai = new openai_1.default({
            baseURL: 'https://api.deepseek.com', // Change this to the standard OpenAI URL if using an OpenAI key
            apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY,
        });
    }
    async analyzeProbability(token, currentPrice, recentVolume, isWhaleBuying, lessonsLearned) {
        const prompt = `
You are the "Arbitrageur of Probability" for a prediction market (like Polymarket).
The market is currently pricing ${token} at $${currentPrice.toFixed(2)} (${(currentPrice * 100).toFixed(1)}% chance).
Recent volume spike: ${recentVolume} shares.
Whale activity detected buying: ${isWhaleBuying}.

Past Lessons Learned:
${lessonsLearned}

Based on this order flow mismatch (Whales vs Retail volume) and the lessons learned, what is the TRUE fair value probability of this market bouncing?
Output a JSON with two fields:
1. "fair_value_probability" (a number between 0.0 and 1.0 representing your predicted odds).
2. "reasoning" (a brief string explaining why).
`;
        try {
            // Check if API key is available
            const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
            if (!apiKey || apiKey.includes('your-') || apiKey === 'test') {
                console.warn('[DeepSeekBrain] No valid API key. Using fallback probability estimation.');
                return this.fallbackAnalysis(currentPrice, isWhaleBuying, lessonsLearned);
            }
            const response = await this.openai.chat.completions.create({
                model: 'deepseek-reasoner', // or gpt-4-turbo if using openai
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            });
            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error('No content returned from LLM');
            }
            const parsed = JSON.parse(content);
            return {
                fair_value_probability: parsed.fair_value_probability,
                reasoning: parsed.reasoning
            };
        }
        catch (error) {
            console.warn('[DeepSeekBrain] LLM analysis failed, using fallback:', error instanceof Error ? error.message : error);
            return this.fallbackAnalysis(currentPrice, isWhaleBuying, lessonsLearned);
        }
    }
    fallbackAnalysis(currentPrice, isWhaleBuying, lessonsLearned) {
        // Simple heuristic: if whales are buying at a low price, prob is higher
        let estimatedProb = Math.min(0.75, currentPrice + 0.25);
        if (isWhaleBuying && currentPrice < 0.5) {
            estimatedProb = Math.min(0.85, currentPrice + 0.4);
        }
        return {
            fair_value_probability: estimatedProb,
            reasoning: `Fallback: whale presence=${isWhaleBuying}, price=${currentPrice}. Estimated bounce probability: ${(estimatedProb * 100).toFixed(1)}%`
        };
    }
}
exports.DeepSeekBrain = DeepSeekBrain;
//# sourceMappingURL=DeepSeekBrain.js.map