export interface SimulatedOrder {
    orderId: string;
    tokenId: string;
    side: 'BUY' | 'SELL';
    price: number;
    size: number;
    status: 'PENDING' | 'FILLED' | 'CANCELLED';
    createdAt: number;
    filledAt?: number;
    filledPrice?: number;
}
export interface SimulatedTrade {
    tradeId: string;
    orderId: string;
    tokenId: string;
    side: 'BUY' | 'SELL';
    price: number;
    size: number;
    pnl: number;
    timestamp: number;
}
export interface SimulatedPosition {
    tokenId: string;
    side: 'LONG' | 'SHORT';
    entryPrice: number;
    size: number;
    entryTime: number;
    currentPrice: number;
    unrealizedPnl: number;
}
/**
 * SimulatedExchange mirrors the Polymarket CLOB API but executes trades
 * in a local SQLite database for paper trading.
 */
export declare class SimulatedExchange {
    private orders;
    private trades;
    private positions;
    private balance;
    private priceFeeds;
    constructor(startingBalance?: number);
    /**
     * Create a new order (mirrors Polymarket CLOB API)
     */
    createOrder(tokenId: string, side: 'BUY' | 'SELL', price: number, size: number): Promise<SimulatedOrder>;
    /**
     * Simulate order fill
     */
    private simulateFill;
    /**
     * Update position after trade
     */
    private updatePosition;
    /**
     * Get order by ID
     */
    getOrder(orderId: string): Promise<SimulatedOrder | null>;
    /**
     * Get all orders
     */
    getOrders(): Promise<SimulatedOrder[]>;
    /**
     * Get all trades
     */
    getTrades(): Promise<SimulatedTrade[]>;
    /**
     * Get all positions
     */
    getPositions(): Promise<SimulatedPosition[]>;
    /**
     * Get current balance
     */
    getBalance(): Promise<number>;
    /**
     * Update price feed for a token
     */
    updatePrice(tokenId: string, price: number): void;
    /**
     * Get current price for a token
     */
    getCurrentPrice(tokenId: string): Promise<number>;
    /**
     * Cancel an order
     */
    cancelOrder(orderId: string): Promise<boolean>;
    /**
     * Get portfolio summary
     */
    getPortfolioSummary(): Promise<{
        balance: number;
        totalPnl: number;
        openPositions: number;
        totalTrades: number;
    }>;
}
//# sourceMappingURL=SimulatedExchange.d.ts.map