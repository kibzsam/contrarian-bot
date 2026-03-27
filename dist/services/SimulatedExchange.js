"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatedExchange = void 0;
const uuid_1 = require("uuid");
/**
 * SimulatedExchange mirrors the Polymarket CLOB API but executes trades
 * in a local SQLite database for paper trading.
 */
class SimulatedExchange {
    constructor(startingBalance = 1000) {
        this.orders = new Map();
        this.trades = [];
        this.positions = new Map();
        this.balance = 1000; // Starting balance
        this.priceFeeds = new Map();
        this.balance = startingBalance;
    }
    /**
     * Create a new order (mirrors Polymarket CLOB API)
     */
    async createOrder(tokenId, side, price, size) {
        const orderId = (0, uuid_1.v4)();
        const order = {
            orderId,
            tokenId,
            side,
            price,
            size,
            status: 'PENDING',
            createdAt: Date.now(),
        };
        this.orders.set(orderId, order);
        console.log(`[SimulatedExchange] Order created: ${side} ${size} ${tokenId} @ $${price.toFixed(4)}`);
        // Simulate immediate fill for paper trading
        await this.simulateFill(orderId);
        return order;
    }
    /**
     * Simulate order fill
     */
    async simulateFill(orderId) {
        const order = this.orders.get(orderId);
        if (!order || order.status !== 'PENDING')
            return;
        // Simulate fill with slight slippage
        const slippage = (Math.random() - 0.5) * 0.01; // ±0.5% slippage
        const filledPrice = Math.max(0.01, Math.min(0.99, order.price + slippage));
        order.status = 'FILLED';
        order.filledAt = Date.now();
        order.filledPrice = filledPrice;
        // Create trade record
        const trade = {
            tradeId: (0, uuid_1.v4)(),
            orderId: order.orderId,
            tokenId: order.tokenId,
            side: order.side,
            price: filledPrice,
            size: order.size,
            pnl: 0,
            timestamp: Date.now(),
        };
        this.trades.push(trade);
        // Update position
        this.updatePosition(order.tokenId, order.side, filledPrice, order.size);
        // Update balance
        const cost = filledPrice * order.size;
        if (order.side === 'BUY') {
            this.balance -= cost;
        }
        else {
            this.balance += cost;
        }
        console.log(`[SimulatedExchange] Order filled: ${order.side} ${order.size} ${order.tokenId} @ $${filledPrice.toFixed(4)}`);
    }
    /**
     * Update position after trade
     */
    updatePosition(tokenId, side, price, size) {
        const existingPosition = this.positions.get(tokenId);
        if (existingPosition) {
            // Update existing position
            if (side === 'BUY') {
                if (existingPosition.side === 'LONG') {
                    // Add to long position
                    const totalSize = existingPosition.size + size;
                    const avgPrice = (existingPosition.entryPrice * existingPosition.size + price * size) / totalSize;
                    existingPosition.size = totalSize;
                    existingPosition.entryPrice = avgPrice;
                }
                else {
                    // Close short position
                    const closeSize = Math.min(existingPosition.size, size);
                    const pnl = (existingPosition.entryPrice - price) * closeSize;
                    existingPosition.size -= closeSize;
                    existingPosition.unrealizedPnl += pnl;
                    if (existingPosition.size <= 0) {
                        this.positions.delete(tokenId);
                    }
                }
            }
            else {
                // SELL
                if (existingPosition.side === 'SHORT') {
                    // Add to short position
                    const totalSize = existingPosition.size + size;
                    const avgPrice = (existingPosition.entryPrice * existingPosition.size + price * size) / totalSize;
                    existingPosition.size = totalSize;
                    existingPosition.entryPrice = avgPrice;
                }
                else {
                    // Close long position
                    const closeSize = Math.min(existingPosition.size, size);
                    const pnl = (price - existingPosition.entryPrice) * closeSize;
                    existingPosition.size -= closeSize;
                    existingPosition.unrealizedPnl += pnl;
                    if (existingPosition.size <= 0) {
                        this.positions.delete(tokenId);
                    }
                }
            }
        }
        else {
            // Create new position
            const position = {
                tokenId,
                side: side === 'BUY' ? 'LONG' : 'SHORT',
                entryPrice: price,
                size,
                entryTime: Date.now(),
                currentPrice: price,
                unrealizedPnl: 0,
            };
            this.positions.set(tokenId, position);
        }
    }
    /**
     * Get order by ID
     */
    async getOrder(orderId) {
        return this.orders.get(orderId) || null;
    }
    /**
     * Get all orders
     */
    async getOrders() {
        return Array.from(this.orders.values());
    }
    /**
     * Get all trades
     */
    async getTrades() {
        return [...this.trades];
    }
    /**
     * Get all positions
     */
    async getPositions() {
        return Array.from(this.positions.values());
    }
    /**
     * Get current balance
     */
    async getBalance() {
        return this.balance;
    }
    /**
     * Update price feed for a token
     */
    updatePrice(tokenId, price) {
        this.priceFeeds.set(tokenId, price);
        // Update unrealized PnL for positions
        const position = this.positions.get(tokenId);
        if (position) {
            position.currentPrice = price;
            if (position.side === 'LONG') {
                position.unrealizedPnl = (price - position.entryPrice) * position.size;
            }
            else {
                position.unrealizedPnl = (position.entryPrice - price) * position.size;
            }
        }
    }
    /**
     * Get current price for a token
     */
    async getCurrentPrice(tokenId) {
        return this.priceFeeds.get(tokenId) || 0.5;
    }
    /**
     * Cancel an order
     */
    async cancelOrder(orderId) {
        const order = this.orders.get(orderId);
        if (!order || order.status !== 'PENDING') {
            return false;
        }
        order.status = 'CANCELLED';
        console.log(`[SimulatedExchange] Order cancelled: ${orderId}`);
        return true;
    }
    /**
     * Get portfolio summary
     */
    async getPortfolioSummary() {
        const positions = await this.getPositions();
        const totalPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
        return {
            balance: this.balance,
            totalPnl,
            openPositions: positions.length,
            totalTrades: this.trades.length,
        };
    }
}
exports.SimulatedExchange = SimulatedExchange;
//# sourceMappingURL=SimulatedExchange.js.map