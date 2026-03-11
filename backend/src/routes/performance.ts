import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, isAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { employeeId, status } = req.query as any;
  const where: any = {};
  if (!isAdmin(req.user?.role) && req.user?.employeeId) where.employeeId = req.user.employeeId;
  else if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;
  const reviews = await prisma.performance.findMany({ where, include: { employee: { select: { firstName: true, lastName: true, employeeId: true, department: true } } }, orderBy: { createdAt: 'desc' } });
  res.json(reviews);
});

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  const review = await prisma.performance.create({ data: req.body, include: { employee: true } });
  res.status(201).json(review);
});

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  const review = await prisma.performance.update({ where: { id: req.params.id as string }, data: req.body });
  res.json(review);
});

export default router;
