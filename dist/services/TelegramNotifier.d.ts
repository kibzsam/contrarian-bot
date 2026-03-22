interface TradeNotification {
    type: 'TRADE_EXECUTED' | 'TRADE_WON' | 'TRADE_LOST' | 'PANIC_DETECTED' | 'BOT_STARTED' | 'BOT_STOPPED' | 'ERROR';
    message: string;
    details?: {
        tokenId?: string;
        price?: number;
        volume?: number;
        amount?: number;
        profit?: number;
        probability?: number;
        error?: string;
    };
}
declare class TelegramNotifier {
    private botToken;
    private chatId;
    private enabled;
    constructor();
    send(notification: TradeNotification): Promise<void>;
    private getEmoji;
    private formatMessage;
    notifyTradeExecuted(tokenId: string, price: number, amount: number, probability: number): Promise<void>;
    notifyTradeWon(tokenId: string, profit: number): Promise<void>;
    notifyTradeLost(tokenId: string, profit: number): Promise<void>;
    notifyPanicDetected(tokenId: string, price: number, volume: number): Promise<void>;
    notifyBotStarted(): Promise<void>;
    notifyBotStopped(): Promise<void>;
    notifyError(error: string, context?: string): Promise<void>;
}
export declare const telegramNotifier: TelegramNotifier;
export {};
//# sourceMappingURL=TelegramNotifier.d.ts.map