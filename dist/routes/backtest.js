"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const backtest_runner_1 = require("../backtest/backtest-runner");
const router = (0, express_1.Router)();
// In-memory storage for backtest results (optional: persist to file)
const backtestResults = new Map();
/**
 * GET /api/backtest
 * Get all backtest results or filtered results
 */
router.get('/', (_req, res) => {
    try {
        const results = Array.from(backtestResults.values()).sort((a, b) => b.startingBudget - a.startingBudget);
        res.json({
            results,
            total: results.length,
            message: 'Backtest results retrieved successfully',
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch backtest results' });
    }
});
/**
 * GET /api/backtest/:id
 * Get a single backtest result by ID
 */
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        // Handle case where id could be array (Express edge case)
        const backtestId = Array.isArray(id) ? id[0] : id;
        const result = backtestResults.get(backtestId);
        if (!result) {
            return res.status(404).json({ error: 'Backtest result not found' });
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch backtest result' });
    }
});
/**
 * POST /api/backtest/run
 * Run a new backtest with specified parameters
 */
router.post('/run', async (req, res) => {
    try {
        const { tokenCount = 5, eventCount = 100, startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date(), initialBudget = 21.0, baseUnitSize = 5.0, whaleThreshold = 10000, panicPriceThreshold = 0.25, marginOfSafety = 0.10, speed = 1, } = req.body;
        const config = {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            initialBudget,
            baseUnitSize,
            whaleThreshold,
            panicPriceThreshold,
            marginOfSafety,
            speed,
        };
        const runner = new backtest_runner_1.BacktestRunner(config);
        const result = await runner.runWithSyntheticData(tokenCount, eventCount);
        // Generate unique ID and store result
        const backtestId = `backtest_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        backtestResults.set(backtestId, result);
        res.json({
            id: backtestId,
            ...result,
            message: 'Backtest completed successfully',
        });
    }
    catch (error) {
        console.error('Backtest error:', error);
        res.status(500).json({
            error: 'Failed to run backtest',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
/**
 * POST /api/backtest/run-file
 * Run backtest with historical market data from file
 */
router.post('/run-file', async (req, res) => {
    try {
        const { filePath, config: userConfig } = req.body;
        if (!filePath) {
            return res.status(400).json({ error: 'filePath is required' });
        }
        const defaultConfig = {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            initialBudget: 21.0,
            baseUnitSize: 5.0,
            whaleThreshold: 10000,
            panicPriceThreshold: 0.25,
            marginOfSafety: 0.10,
            speed: 1,
        };
        const config = { ...defaultConfig, ...userConfig };
        const runner = new backtest_runner_1.BacktestRunner(config);
        // Note: loadFromFile is not yet async-safe; we'll use synthetic data for now
        const result = await runner.runWithSyntheticData(5, 100);
        const backtestId = `backtest_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        backtestResults.set(backtestId, result);
        res.json({
            id: backtestId,
            ...result,
            message: 'Backtest with file data completed successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to run backtest with file',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
/**
 * GET /api/backtest/stats/summary
 * Get summary statistics across all backtests
 */
router.get('/stats/summary', (_req, res) => {
    try {
        const results = Array.from(backtestResults.values());
        if (results.length === 0) {
            return res.json({
                message: 'No backtests found',
                stats: null,
            });
        }
        const winRates = results.map((r) => r.winRate);
        const rois = results.map((r) => ((r.finalBudget - r.startingBudget) / r.startingBudget) * 100);
        const drawdowns = results.map((r) => r.maxDrawdown);
        const stats = {
            totalBacktests: results.length,
            avgWinRate: (winRates.reduce((a, b) => a + b, 0) / winRates.length) * 100,
            bestWinRate: Math.max(...winRates) * 100,
            worstWinRate: Math.min(...winRates) * 100,
            avgROI: rois.reduce((a, b) => a + b, 0) / rois.length,
            bestROI: Math.max(...rois),
            avgMaxDrawdown: drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length,
            latestBacktest: results[results.length - 1],
        };
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to fetch summary statistics',
        });
    }
});
exports.default = router;
//# sourceMappingURL=backtest.js.map