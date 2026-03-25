import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// Get all backtest results
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const results = await db.backtestResult.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.backtestResult.count();

    res.json({
      results,
      total,
      limit,
      offset,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch backtest results' });
  }
});

// Get single backtest result
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.backtestResult.findUnique({
      where: { id: req.params.id },
    });

    if (!result) {
      return res.status(404).json({ error: 'Backtest result not found' });
    }

    // Parse JSON fields
    const parsed = {
      ...result,
      parameters: JSON.parse(result.parameters),
      results: JSON.parse(result.results),
    };

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch backtest result' });
  }
});

// Create new backtest result
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      strategyVersion,
      totalTrades,
      winCount,
      lossCount,
      totalPnL,
      maxDrawdown,
      sharpeRatio,
      sortinoRatio,
      profitFactor,
      avgWin,
      avgLoss,
      startDate,
      endDate,
      parameters,
      results,
    } = req.body;

    const winRate = totalTrades > 0 ? winCount / totalTrades : 0;

    const backtest = await db.backtestResult.create({
      data: {
        name,
        strategyVersion,
        totalTrades,
        winCount,
        lossCount,
        winRate,
        totalPnL,
        maxDrawdown,
        sharpeRatio,
        sortinoRatio,
        profitFactor,
        avgWin,
        avgLoss,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        parameters: JSON.stringify(parameters),
        results: JSON.stringify(results),
      },
    });

    res.json(backtest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create backtest result' });
  }
});

// Get performance comparison stats
router.get('/stats/comparison', async (_req: Request, res: Response) => {
  try {
    const results = await db.backtestResult.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const stats = {
      bestWinRate: Math.max(...results.map((r: any) => r.winRate)),
      bestSharpe: Math.max(...results.map((r: any) => r.sharpeRatio || 0)),
      bestTotalPnL: Math.max(...results.map((r: any) => r.totalPnL)),
      averageWinRate:
        results.reduce((sum: number, r: any) => sum + r.winRate, 0) / results.length,
      latestBacktest: results[0],
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comparison stats' });
  }
});

export default router;
