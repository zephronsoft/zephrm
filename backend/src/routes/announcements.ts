import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (_req, res: Response) => {
  const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
  res.json(announcements);
});

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  const ann = await prisma.announcement.create({ data: { ...req.body, createdById: req.user?.id } });
  res.status(201).json(ann);
});

export default router;
