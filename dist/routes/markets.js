"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
// Get market opportunities sorted by contrarian score
router.get('/opportunities', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const category = req.query.category;
        const minScore = parseFloat(req.query.minScore) || 0;
        const where = {
            contraryScore: { gte: minScore },
        };
        if (category) {
            where.category = category;
        }
        const opportunities = await database_1.db.marketOpportunity.findMany({
            where,
            orderBy: { contraryScore: 'desc' },
            take: limit,
        });
        res.json(opportunities);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch market opportunities' });
    }
});
// Get single market opportunity
router.get('/opportunities/:marketId', async (req, res) => {
    try {
        const marketId = Array.isArray(req.params.marketId) ? req.params.marketId[0] : req.params.marketId;
        const opportunity = await database_1.db.marketOpportunity.findUnique({
            where: { marketId },
        });
        if (!opportunity) {
            return res.status(404).json({ error: 'Market opportunity not found' });
        }
        res.json(opportunity);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch market opportunity' });
    }
});
// Get market categories
router.get('/categories', async (_req, res) => {
    try {
        const categories = await database_1.db.marketOpportunity.findMany({
            distinct: ['category'],
            select: { category: true },
        });
        res.json(categories.map((c) => c.category));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
// Upsert market opportunity (used by AI scanner)
router.post('/opportunities', async (req, res) => {
    try {
        const { marketId, marketName, category, currentOdds, liquidity, volume24h, spread, timeToResolution, crowdSentiment, contraryScore, whaleActivity, recommendation, reasoning, } = req.body;
        const opportunity = await database_1.db.marketOpportunity.upsert({
            where: { marketId },
            update: {
                currentOdds,
                liquidity,
                volume24h,
                spread,
                timeToResolution,
                crowdSentiment,
                contraryScore,
                whaleActivity,
                recommendation,
                reasoning,
                lastUpdated: new Date(),
            },
            create: {
                marketId,
                marketName,
                category,
                currentOdds,
                liquidity,
                volume24h,
                spread,
                timeToResolution,
                crowdSentiment,
                contraryScore,
                whaleActivity,
                recommendation,
                reasoning,
            },
        });
        res.json(opportunity);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to upsert market opportunity' });
    }
});
exports.default = router;
//# sourceMappingURL=markets.js.map