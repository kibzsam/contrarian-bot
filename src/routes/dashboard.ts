import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// Get overall dashboard stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's trades
    const todaysTrades = await db.trade.findMany({
      where: {
        executedAt: {
          gte: today,
        },
      },
    });

    // Get all-time stats
    const allTrades = await db.trade.findMany({
      where: { status: 'CLOSED' },
    });

    const closedTrades = allTrades.length;
    const wins = allTrades.filter((t: any) => t.pnl && t.pnl > 0).length;
    const losses = allTrades.filter((t: any) => t.pnl && t.pnl < 0).length;

    const totalPnL = allTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
    const todayPnL = todaysTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);

    const latestSnapshot = await db.bankrollSnapshot.findFirst({
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get recent trades
router.get('/trades', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const trades = await db.trade.findMany({
      orderBy: { executedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.trade.count();

    res.json({
      trades,
      total,
      limit,
      offset,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Get single trade with full LLM reasoning
router.get('/trades/:id', async (req: Request, res: Response) => {
  try {
    const tradeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const trade = await db.trade.findUnique({
      where: { id: tradeId },
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    res.json(trade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trade' });
  }
});

// Record a new trade
router.post('/trades', async (req: Request, res: Response) => {
  try {
    const {
      marketId,
      marketName,
      orderType,
      entryPrice,
      quantity,
      reasoning,
    } = req.body;

    const trade = await db.trade.create({
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to create trade' });
  }
});

// Close a trade
router.patch('/trades/:id/close', async (req: Request, res: Response) => {
  try {
    const { exitPrice } = req.body;
    const tradeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const trade = await db.trade.findUnique({
      where: { id: tradeId },
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const pnl = (exitPrice - trade.entryPrice) * trade.quantity;

    const updatedTrade = await db.trade.update({
      where: { id: tradeId },
      data: {
        exitPrice,
        status: 'CLOSED',
        pnl,
        closedAt: new Date(),
      },
    });

    res.json(updatedTrade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to close trade' });
  }
});

export default router;
