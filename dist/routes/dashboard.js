"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
// Get overall dashboard stats
router.get('/stats', async (_req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Get today's trades
        const todaysTrades = await database_1.db.trade.findMany({
            where: {
                executedAt: {
                    gte: today,
                },
            },
        });
        // Get all-time stats
        const allTrades = await database_1.db.trade.findMany({
            where: { status: 'CLOSED' },
        });
        const closedTrades = allTrades.length;
        const wins = allTrades.filter((t) => t.pnl && t.pnl > 0).length;
        const losses = allTrades.filter((t) => t.pnl && t.pnl < 0).length;
        const totalPnL = allTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const todayPnL = todaysTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const latestSnapshot = await database_1.db.bankrollSnapshot.findFirst({
            orderBy: { snapshotAt: 'desc' },
        });
        res.json({
            todayPnL,
            totalPnL,
            totalTrades: closedTrades,
            winRate: closedTrades > 0 ? (wins / closedTrades) * 100 : 0,
            wins,
            losses,
            bankroll: latestSnapshot?.totalBankroll || 0,
            availableBalance: latestSnapshot?.availableBalance || 0,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
// Get recent trades
router.get('/trades', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const trades = await database_1.db.trade.findMany({
            orderBy: { executedAt: 'desc' },
            take: limit,
            skip: offset,
        });
        const total = await database_1.db.trade.count();
        res.json({
            trades,
            total,
            limit,
            offset,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch trades' });
    }
});
// Get single trade with full LLM reasoning
router.get('/trades/:id', async (req, res) => {
    try {
        const tradeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const trade = await database_1.db.trade.findUnique({
            where: { id: tradeId },
        });
        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }
        res.json(trade);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch trade' });
    }
});
// Record a new trade
router.post('/trades', async (req, res) => {
    try {
        const { marketId, marketName, orderType, entryPrice, quantity, reasoning, } = req.body;
        const trade = await database_1.db.trade.create({
            data: {
                marketId,
                marketName,
                orderType,
                entryPrice,
                quantity,
                status: 'OPEN',
                reasoning,
                pnl: 0,
            },
        });
        res.json(trade);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create trade' });
    }
});
// Close a trade
router.patch('/trades/:id/close', async (req, res) => {
    try {
        const { exitPrice } = req.body;
        const tradeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const trade = await database_1.db.trade.findUnique({
            where: { id: tradeId },
        });
        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }
        const pnl = (exitPrice - trade.entryPrice) * trade.quantity;
        const updatedTrade = await database_1.db.trade.update({
            where: { id: tradeId },
            data: {
                exitPrice,
                status: 'CLOSED',
                pnl,
                closedAt: new Date(),
            },
        });
        res.json(updatedTrade);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to close trade' });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map