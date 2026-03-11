import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const LEVEL_ORDER: Record<string, number> = { EXECUTIVE: 0, SENIOR: 1, MID: 2, JUNIOR: 3 };

router.get('/', authenticate, async (_req, res: Response) => {
  try {
    const positions = await prisma.position.findMany({ orderBy: { title: 'asc' } });
    positions.sort((a, b) => {
      const aLevel = LEVEL_ORDER[a.level || 'MID'] ?? 2;
      const bLevel = LEVEL_ORDER[b.level || 'MID'] ?? 2;
      return aLevel !== bLevel ? aLevel - bLevel : (a.title || '').localeCompare(b.title || '');
    });
    res.json(positions);
  } catch (e: any) {
    console.error('Positions fetch error:', e?.message);
    res.status(500).json({ message: e?.message || 'Failed to fetch positions' });
  }
});

export default router;
