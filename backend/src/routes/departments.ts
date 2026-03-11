import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (_req, res: Response) => {
  const departments = await prisma.department.findMany({ include: { _count: { select: { employees: true } } } });
  res.json(departments);
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const dept = await prisma.department.create({ data: req.body });
    res.status(201).json(dept);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const dept = await prisma.department.update({ where: { id: req.params.id as string }, data: req.body });
  res.json(dept);
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  await prisma.department.delete({ where: { id: req.params.id as string } });
  res.json({ message: 'Deleted' });
});

export default router;
