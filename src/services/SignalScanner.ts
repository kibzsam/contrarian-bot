import WebSocket from 'ws';
import { EventEmitter } from 'events';



export interface MarketContextEvent {
  tokenId: string;
  currentPrice: number;
  recentVolume: number;
  isWhaleBuying: boolean;
  priceDropPercent?: number;
}

export interface ScannerConfig {
  whaleThreshold: number;
  panicPriceThreshold: number;
  wssUrl?: string;
}

interface PricePoint {
  price: number;
  timestamp: number;
}

export class SignalScanner extends EventEmitter {
  private ws: WebSocket | null = null;
  private polymarketClobWsUrl = 'wss://ws-subscriptions-clob.polymarket.com/ws/';
  private pingInterval: NodeJS.Timeout | null = null;
  
  // Track volume for tokens
  private volumeTracker: Record<string, number> = {};
  private whaleThreshold: number;
  private panicPriceThreshold: number;
  
  // Track price history for time-windowed analysis (60 minutes)
  private priceHistory: Map<string, PricePoint[]> = new Map();
  private readonly PRICE_HISTORY_WINDOW_MS = 60 * 60 * 1000; // 60 minutes
  private readonly PRICE_DROP_THRESHOLD = 0.10; // 10% drop
  
  // Dynamically fetched tokens on startup
  private monitoredTokens: string[] = [];

  constructor(config: ScannerConfig) {
    super();
    this.whaleThreshold = config.whaleThreshold;
    this.panicPriceThreshold = config.panicPriceThreshold;
    if (config.wssUrl) {
      this.polymarketClobWsUrl = config.wssUrl;
    }
  }

  public async start() {
    console.log(`Starting SignalScanner on ${this.polymarketClobWsUrl}`);
    await this.fetchActiveTokens();
    this.connect();
  }

  private async fetchActiveTokens() {
    try {
      console.log('Fetching top active markets from Polymarket Gamma API...');
      const response = await fetch('https://gamma-api.polymarket.com/events?active=true&closed=false&limit=10');
      const eventsData = await response.json();
      
      const tokens: string[] = [];
      if (Array.isArray(eventsData)) {
        for (const event of eventsData) {
           if (event.markets && Array.isArray(event.markets)) {
              for (const market of event.markets) {
                 if (market.clobTokenIds) {
                    const ids = JSON.parse(market.clobTokenIds);
                    tokens.push(...ids);
                 }
              }
           }
        }
      }
      
      // Limit to avoid overloading the WS subscription
      this.monitoredTokens = tokens.slice(0, 50);
      console.log(`Successfully fetched ${this.monitoredTokens.length} active token IDs to monitor.`);
    } catch (error) {
      console.error('Failed to fetch active tokens. Falling back to default token:', error);
      // Fallback valid token just in case
      this.monitoredTokens = ['0x211756285ddaf2bcbaea2a2cf3df145b271d4715f3a7d5ea8ab8dcdcd1dafd51'];
    }
  }

  private connect() {
    if (this.ws) {
      this.stop();
    }

    this.ws = new WebSocket(this.polymarketClobWsUrl);

    this.ws.on('open', () => {
      console.log('Connected to Polymarket CLOB WebSocket');
      this.subscribeToMarkets();
      
      // Keep-alive ping
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send('PING');
        }
      }, 30000); // 30 seconds
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      const messageStr = data.toString();
      if (messageStr === 'PONG') {
         return;
      }
      
      try {
        const message = JSON.parse(messageStr);
        this.handleMessage(message);
      } catch (error) {
         console.error('Failed to parse WS message:', error, messageStr);
      }
    });

    this.ws.on('close', () => {
      console.error('WebSocket connection closed. Attempting to reconnect in 5s...');
      this.clearPing();
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  }

  private subscribeToMarkets() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const subscriptionMsg = {
      assets_ids: this.monitoredTokens,
      type: "market" // Subscribe to the market channel for orderbook updates
    };

    this.ws.send(JSON.stringify(subscriptionMsg));
    console.log(`Subscribed to markets: ${this.monitoredTokens.join(', ')}`);
  }

  private handleMessage(message: any) {
    // Look for price drops accompanied by volume data.
    // In Polymarket's market stream, the price_change doesn't strictly have volume.
    // However, trades and order book events do.
    
    if (message.event_type === 'last_trade_price' || message.event_type === 'price_change') {
       const tokenId = message.asset_id;
       const newPrice = parseFloat(message.price);
       
       // Simulate parsing volume from order book changes or trades
       // Real implementation would track cumulative volume from 'trade' events
       const simulatedTradeVolume = Math.random() * 15000;
       
       this.volumeTracker[tokenId] = (this.volumeTracker[tokenId] || 0) + simulatedTradeVolume;
       
       const isWhaleBuying = simulatedTradeVolume > this.whaleThreshold && newPrice > 0.10;

       // Track price history for time-windowed analysis
       this.trackPriceHistory(tokenId, newPrice);
       
       // Check for price drop >10% in <60 minutes
       const priceDropPercent = this.calculatePriceDropPercent(tokenId);
       const hasSignificantDrop = priceDropPercent !== null && priceDropPercent >= this.PRICE_DROP_THRESHOLD;

       // If the price is low (below panic threshold) AND we see a whale stepping in
       // OR if there's a significant price drop (>10% in <60m) with whale activity
       if ((newPrice < this.panicPriceThreshold && isWhaleBuying) || (hasSignificantDrop && isWhaleBuying)) {
          const contextEvent: MarketContextEvent = {
             tokenId: tokenId,
             currentPrice: newPrice,
             recentVolume: this.volumeTracker[tokenId],
             isWhaleBuying: isWhaleBuying,
             priceDropPercent: priceDropPercent || undefined,
          };
          this.emit('market_opportunity', contextEvent);
          
          // Reset tracker after emitting to avoid spam
          this.volumeTracker[tokenId] = 0;
       }
    }
  }

  /**
   * Track price history for a token
   */
  private trackPriceHistory(tokenId: string, price: number): void {
    const now = Date.now();
    const history = this.priceHistory.get(tokenId) || [];
    
    // Add new price point
    history.push({ price, timestamp: now });
    
    // Remove old price points (older than 60 minutes)
    const cutoff = now - this.PRICE_HISTORY_WINDOW_MS;
    const filteredHistory = history.filter(point => point.timestamp > cutoff);
    
    this.priceHistory.set(tokenId, filteredHistory);
  }

  /**
   * Calculate price drop percentage over the last 60 minutes
   * Returns null if insufficient data
   */
  private calculatePriceDropPercent(tokenId: string): number | null {
    const history = this.priceHistory.get(tokenId);
    if (!history || history.length < 2) return null;
    
    // Get the oldest price in the window (first element)
    const oldestPrice = history[0].price;
    const newestPrice = history[history.length - 1].price;
    
    if (oldestPrice <= 0) return null;
    
    const dropPercent = (oldestPrice - newestPrice) / oldestPrice;
    return dropPercent;
  }

  private clearPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public stop() {
    this.clearPing();
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
  }
}
