import OpenAI from 'openai';

export interface ProbabilityAnalysisResult {
  fair_value_probability: number; // 0.0 to 1.0 (e.g., 0.35 means 35% chance)
  reasoning: string;
}

export class DeepSeekBrain {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      baseURL: 'https://api.deepseek.com', // Change this to the standard OpenAI URL if using an OpenAI key
      apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY, 
    });
  }

  async analyzeProbability(
    token: string, 
    currentPrice: number, 
    recentVolume: number, 
    isWhaleBuying: boolean,
    lessonsLearned: string
  ): Promise<ProbabilityAnalysisResult> {
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
      } as ProbabilityAnalysisResult;
    } catch (error: unknown) {
      console.error('LLM analysis failed:', error);
      throw new Error('Failed to analyze probability');
    }
  }
}
