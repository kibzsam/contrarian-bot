import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// Get market opportunities sorted by contrarian score
router.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const category = req.query.category as string;
    const minScore = parseFloat(req.query.minScore as string) || 0;

    const where: any = {
      contraryScore: { gte: minScore },
    };

    if (category) {
      where.category = category;
    }

    const opportunities = await db.marketOpportunity.findMany({
      where,
      orderBy: { contraryScore: 'desc' },
      take: limit,
    });

    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch market opportunities' });
  }
});

// Get single market opportunity
router.get('/opportunities/:marketId', async (req: Request, res: Response) => {
  try {
    const opportunity = await db.marketOpportunity.findUnique({
      where: { marketId: req.params.marketId },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Market opportunity not found' });
    }

    res.json(opportunity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch market opportunity' });
  }
});

// Get market categories
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await db.marketOpportunity.findMany({
      distinct: ['category'],
      select: { category: true },
    });

    res.json(categories.map((c: { category: string }) => c.category));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Upsert market opportunity (used by AI scanner)
router.post('/opportunities', async (req: Request, res: Response) => {
  try {
    const {
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
    } = req.body;

    const opportunity = await db.marketOpportunity.upsert({
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to upsert market opportunity' });
  }
});

export default router;
