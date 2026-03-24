"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketReplay = void 0;
const events_1 = require("events");
class MarketReplay extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.snapshots = [];
        this.currentIndex = 0;
        this.isRunning = false;
        this.replayTimer = null;
        this.config = config;
    }
    /**
     * Load historical market snapshots from array
     */
    loadSnapshots(snapshots) {
        this.snapshots = snapshots.sort((a, b) => a.timestamp - b.timestamp);
        console.log(`[MarketReplay] Loaded ${this.snapshots.length} market snapshots`);
    }
    /**
     * Load snapshots from JSON file
     */
    async loadFromFile(filePath) {
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const data = await fs.readFile(filePath, 'utf8');
            const snapshots = JSON.parse(data);
            this.loadSnapshots(snapshots);
        }
        catch (error) {
            throw new Error(`Failed to load market data from ${filePath}: ${error}`);
        }
    }
    /**
     * Generate synthetic market data for testing
     */
    generateSyntheticData(tokenCount = 5, eventCount = 100) {
        const snapshots = [];
        const tokens = Array.from({ length: tokenCount }, (_, i) => `0x${i.toString().padStart(64, '0')}`);
        let currentTimestamp = this.config.startDate.getTime();
        const endTimestamp = this.config.endDate.getTime();
        const timeStep = (endTimestamp - currentTimestamp) / eventCount;
        for (let i = 0; i < eventCount; i++) {
            const tokenId = tokens[Math.floor(Math.random() * tokens.length)];
            const price = Math.random() * 0.9 + 0.1; // 0.1 to 1.0
            const volume = Math.random() * 20000 + 1000;
            const isWhaleBuying = price < this.config.panicPriceThreshold &&
                volume > this.config.whaleThreshold;
            snapshots.push({
                timestamp: Math.floor(currentTimestamp),
                tokenId,
                price,
                volume,
                isWhaleBuying,
            });
            currentTimestamp += timeStep;
        }
        this.loadSnapshots(snapshots);
    }
    /**
     * Start replaying market events
     */
    async start() {
        if (this.isRunning) {
            console.warn('[MarketReplay] Replay already running');
            return;
        }
        if (this.snapshots.length === 0) {
            throw new Error('No market snapshots loaded. Call loadSnapshots() first.');
        }
        this.isRunning = true;
        this.currentIndex = 0;
        this.emit('replay_started', {
            totalSnapshots: this.snapshots.length,
            startDate: new Date(this.snapshots[0].timestamp),
            endDate: new Date(this.snapshots[this.snapshots.length - 1].timestamp),
        });
        await this.runReplay();
    }
    /**
     * Stop the replay
     */
    stop() {
        this.isRunning = false;
        if (this.replayTimer) {
            clearTimeout(this.replayTimer);
            this.replayTimer = null;
        }
        this.emit('replay_stopped', { completedSnapshots: this.currentIndex });
    }
    /**
     * Get current replay progress
     */
    getProgress() {
        const total = this.snapshots.length;
        const percentage = total === 0 ? 0 : (this.currentIndex / total) * 100;
        return { current: this.currentIndex, total, percentage };
    }
    async runReplay() {
        while (this.isRunning && this.currentIndex < this.snapshots.length) {
            const snapshot = this.snapshots[this.currentIndex];
            // Convert snapshot to MarketContextEvent
            const event = {
                tokenId: snapshot.tokenId,
                currentPrice: snapshot.price,
                recentVolume: snapshot.volume,
                isWhaleBuying: snapshot.isWhaleBuying,
            };
            this.emit('market_snapshot', event);
            // Calculate delay based on speed multiplier
            const nextSnapshot = this.snapshots[this.currentIndex + 1];
            if (nextSnapshot) {
                const timeDiff = nextSnapshot.timestamp - snapshot.timestamp;
                const delayMs = Math.max(100, timeDiff / this.config.speed);
                await this.delay(delayMs);
            }
            this.currentIndex++;
        }
        if (this.isRunning) {
            this.isRunning = false;
            this.emit('replay_completed', { totalSnapshots: this.snapshots.length });
        }
    }
    delay(ms) {
        return new Promise((resolve) => {
            this.replayTimer = setTimeout(resolve, ms);
        });
    }
}
exports.MarketReplay = MarketReplay;
//# sourceMappingURL=market-replay.js.map