export interface ProbabilityAnalysisResult {
    fair_value_probability: number;
    reasoning: string;
}
export declare class DeepSeekBrain {
    private openai;
    constructor();
    analyzeProbability(token: string, currentPrice: number, recentVolume: number, isWhaleBuying: boolean, lessonsLearned: string): Promise<ProbabilityAnalysisResult>;
}
//# sourceMappingURL=DeepSeekBrain.d.ts.map