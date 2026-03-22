"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalScanner = void 0;
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
class SignalScanner extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.ws = null;
        this.polymarketClobWsUrl = 'wss://ws-subscriptions-clob.polymarket.com/ws/';
        this.pingInterval = null;
        // Track volume for tokens
        this.volumeTracker = {};
        // Dynamically fetched tokens on startup
        this.monitoredTokens = [];
        this.whaleThreshold = config.whaleThreshold;
        this.panicPriceThreshold = config.panicPriceThreshold;
        if (config.wssUrl) {
            this.polymarketClobWsUrl = config.wssUrl;
        }
    }
    async start() {
        console.log(`Starting SignalScanner on ${this.polymarketClobWsUrl}`);
        await this.fetchActiveTokens();
        this.connect();
    }
    async fetchActiveTokens() {
        try {
            console.log('Fetching top active markets from Polymarket Gamma API...');
            const response = await fetch('https://gamma-api.polymarket.com/events?active=true&closed=false&limit=10');
            const eventsData = await response.json();
            const tokens = [];
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
        }
        catch (error) {
            console.error('Failed to fetch active tokens. Falling back to default token:', error);
            // Fallback valid token just in case
            this.monitoredTokens = ['0x211756285ddaf2bcbaea2a2cf3df145b271d4715f3a7d5ea8ab8dcdcd1dafd51'];
        }
    }
    connect() {
        if (this.ws) {
            this.stop();
        }
        this.ws = new ws_1.default(this.polymarketClobWsUrl);
        this.ws.on('open', () => {
            console.log('Connected to Polymarket CLOB WebSocket');
            this.subscribeToMarkets();
            // Keep-alive ping
            this.pingInterval = setInterval(() => {
                if (this.ws?.readyState === ws_1.default.OPEN) {
                    this.ws.send('PING');
                }
            }, 30000); // 30 seconds
        });
        this.ws.on('message', (data) => {
            const messageStr = data.toString();
            if (messageStr === 'PONG') {
                return;
            }
            try {
                const message = JSON.parse(messageStr);
                this.handleMessage(message);
            }
            catch (error) {
                console.error('Failed to parse WS message:', error, messageStr);
            }
        });
        this.ws.on('close', () => {
            console.error('WebSocket connection closed. Attempting to reconnect in 5s...');
            this.clearPing();
            setTimeout(() => this.connect(), 5000);
        });
        this.ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }
    subscribeToMarkets() {
        if (!this.ws || this.ws.readyState !== ws_1.default.OPEN)
            return;
        const subscriptionMsg = {
            assets_ids: this.monitoredTokens,
            type: "market" // Subscribe to the market channel for orderbook updates
        };
        this.ws.send(JSON.stringify(subscriptionMsg));
        console.log(`Subscribed to markets: ${this.monitoredTokens.join(', ')}`);
    }
    handleMessage(message) {
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
            // If the price is low (below panic threshold) AND we see a whale stepping in
            if (newPrice < this.panicPriceThreshold && isWhaleBuying) {
                const contextEvent = {
                    tokenId: tokenId,
                    currentPrice: newPrice,
                    recentVolume: this.volumeTracker[tokenId],
                    isWhaleBuying: isWhaleBuying
                };
                this.emit('market_opportunity', contextEvent);
                // Reset tracker after emitting to avoid spam
                this.volumeTracker[tokenId] = 0;
            }
        }
    }
    clearPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    stop() {
        this.clearPing();
        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.close();
            this.ws = null;
        }
    }
}
exports.SignalScanner = SignalScanner;
//# sourceMappingURL=SignalScanner.js.map