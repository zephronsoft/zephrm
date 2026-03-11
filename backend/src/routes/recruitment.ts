import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/jobs', authenticate, async (_req, res: Response) => {
  const jobs = await prisma.jobPosting.findMany({ include: { _count: { select: { applications: true } } }, orderBy: { createdAt: 'desc' } });
  res.json(jobs);
});

router.post('/jobs', authenticate, async (req: AuthRequest, res: Response) => {
  const job = await prisma.jobPosting.create({ data: req.body });
  res.status(201).json(job);
});

router.put('/jobs/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const job = await prisma.jobPosting.update({ where: { id: req.params.id as string }, data: req.body });
  res.json(job);
});

router.get('/applications', authenticate, async (_req, res: Response) => {
  const apps = await prisma.application.findMany({ include: { jobPosting: true }, orderBy: { createdAt: 'desc' } });
  res.json(apps);
});

router.post('/applications', authenticate, async (req: AuthRequest, res: Response) => {
  const app = await prisma.application.create({ data: req.body, include: { jobPosting: true } });
  res.status(201).json(app);
});

router.put('/applications/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const app = await prisma.application.update({ where: { id: req.params.id as string }, data: req.body });
  res.json(app);
});

export default router;
