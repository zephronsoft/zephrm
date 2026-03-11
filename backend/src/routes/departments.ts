import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

router.get('/', authenticate, async (_req, res: Response) => {
  const departments = await prisma.department.findMany({ include: { _count: { select: { employees: true } } } });
  res.json(departments);
});

router.post('/', authenticate, authorize(...ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const org = await prisma.organization.findFirst();
    if (!org?.customizeOrg) {
      return res.status(403).json({ message: 'Organization does not allow custom departments' });
    }

    const payload = req.body;

    if (Array.isArray(payload)) {
      if (!payload.length) {
        return res.status(400).json({ message: 'Departments list cannot be empty' });
      }

      const prepared = payload.map((item: any) => ({
        name: String(item?.name || '').trim(),
        description: item?.description ? String(item.description).trim() : null,
      }));

      const invalid = prepared.some((item) => !item.name);
      if (invalid) {
        return res.status(400).json({ message: 'Each department must have a name' });
      }

      const created = await prisma.$transaction(
        prepared.map((item) => prisma.department.create({ data: item }))
      );

      return res.status(201).json(created);
    }

    const dept = await prisma.department.create({ data: payload });
    return res.status(201).json(dept);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', authenticate, authorize(...ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  const dept = await prisma.department.update({ where: { id: req.params.id as string }, data: req.body });
  res.json(dept);
});

router.delete('/:id', authenticate, authorize(...ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  await prisma.department.delete({ where: { id: req.params.id as string } });
  res.json({ message: 'Deleted' });
});

export default router;
