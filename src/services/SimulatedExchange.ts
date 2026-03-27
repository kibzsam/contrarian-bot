import { v4 as uuidv4 } from 'uuid';

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
export class SimulatedExchange {
  private orders: Map<string, SimulatedOrder> = new Map();
  private trades: SimulatedTrade[] = [];
  private positions: Map<string, SimulatedPosition> = new Map();
  private balance: number = 1000; // Starting balance
  private priceFeeds: Map<string, number> = new Map();

  constructor(startingBalance: number = 1000) {
    this.balance = startingBalance;
  }

  /**
   * Create a new order (mirrors Polymarket CLOB API)
   */
  async createOrder(
    tokenId: string,
    side: 'BUY' | 'SELL',
    price: number,
    size: number
  ): Promise<SimulatedOrder> {
    const orderId = uuidv4();
    const order: SimulatedOrder = {
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
  private async simulateFill(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order || order.status !== 'PENDING') return;

    // Simulate fill with slight slippage
    const slippage = (Math.random() - 0.5) * 0.01; // ±0.5% slippage
    const filledPrice = Math.max(0.01, Math.min(0.99, order.price + slippage));

    order.status = 'FILLED';
    order.filledAt = Date.now();
    order.filledPrice = filledPrice;

    // Create trade record
    const trade: SimulatedTrade = {
      tradeId: uuidv4(),
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
    } else {
      this.balance += cost;
    }

    console.log(`[SimulatedExchange] Order filled: ${order.side} ${order.size} ${order.tokenId} @ $${filledPrice.toFixed(4)}`);
  }

  /**
   * Update position after trade
   */
  private updatePosition(
    tokenId: string,
    side: 'BUY' | 'SELL',
    price: number,
    size: number
  ): void {
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
        } else {
          // Close short position
          const closeSize = Math.min(existingPosition.size, size);
          const pnl = (existingPosition.entryPrice - price) * closeSize;
          existingPosition.size -= closeSize;
          existingPosition.unrealizedPnl += pnl;
          
          if (existingPosition.size <= 0) {
            this.positions.delete(tokenId);
          }
        }
      } else {
        // SELL
        if (existingPosition.side === 'SHORT') {
          // Add to short position
          const totalSize = existingPosition.size + size;
          const avgPrice = (existingPosition.entryPrice * existingPosition.size + price * size) / totalSize;
          existingPosition.size = totalSize;
          existingPosition.entryPrice = avgPrice;
        } else {
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
    } else {
      // Create new position
      const position: SimulatedPosition = {
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
  async getOrder(orderId: string): Promise<SimulatedOrder | null> {
    return this.orders.get(orderId) || null;
  }

  /**
   * Get all orders
   */
  async getOrders(): Promise<SimulatedOrder[]> {
    return Array.from(this.orders.values());
  }

  /**
   * Get all trades
   */
  async getTrades(): Promise<SimulatedTrade[]> {
    return [...this.trades];
  }

  /**
   * Get all positions
   */
  async getPositions(): Promise<SimulatedPosition[]> {
    return Array.from(this.positions.values());
  }

  /**
   * Get current balance
   */
  async getBalance(): Promise<number> {
    return this.balance;
  }

  /**
   * Update price feed for a token
   */
  updatePrice(tokenId: string, price: number): void {
    this.priceFeeds.set(tokenId, price);
    
    // Update unrealized PnL for positions
    const position = this.positions.get(tokenId);
    if (position) {
      position.currentPrice = price;
      if (position.side === 'LONG') {
        position.unrealizedPnl = (price - position.entryPrice) * position.size;
      } else {
        position.unrealizedPnl = (position.entryPrice - price) * position.size;
      }
    }
  }

  /**
   * Get current price for a token
   */
  async getCurrentPrice(tokenId: string): Promise<number> {
    return this.priceFeeds.get(tokenId) || 0.5;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
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
  async getPortfolioSummary(): Promise<{
    balance: number;
    totalPnl: number;
    openPositions: number;
    totalTrades: number;
  }> {
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
