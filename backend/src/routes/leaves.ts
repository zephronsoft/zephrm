import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, isAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const toDateTime = (d: any) => {
  if (!d) return undefined;
  const s = String(d);
  return s.includes('T') ? new Date(s) : new Date(s + 'T00:00:00.000Z');
};

router.get('/types', authenticate, async (_req, res: Response) => {
  const types = await prisma.leaveType.findMany();
  res.json(types);
});

router.post('/types', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const type = await prisma.leaveType.create({ data: req.body });
    res.status(201).json(type);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.query.employeeId as string;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const skip = (page - 1) * limit;
    const where: any = {};
    if (!isAdmin(req.user?.role) && req.user?.employeeId) {
      where.employeeId = req.user.employeeId;
    } else if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where, skip, take: limit,
        include: {
          employee: { select: { firstName: true, lastName: true, employeeId: true } },
          leaveType: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.leaveRequest.count({ where }),
    ]);
    res.json({ requests, total });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, days, employeeId, ...rest } = req.body;
    const empId = isAdmin(req.user?.role) ? employeeId : req.user?.employeeId;
    if (!empId) return res.status(400).json({ message: 'Employee not linked to your account' });
    const request = await prisma.leaveRequest.create({
      data: {
        ...rest,
        employeeId: empId,
        startDate: toDateTime(startDate)!,
        endDate: toDateTime(endDate)!,
        days: parseInt(String(days)),
      },
      include: { leaveType: true, employee: { select: { firstName: true, lastName: true } } }
    });
    res.status(201).json(request);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.put('/:id/approve', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id as string },
      data: { status: 'APPROVED', approvedById: req.user?.id, approvedAt: new Date() }
    });
    res.json(updated);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.put('/:id/reject', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id as string },
      data: { status: 'REJECTED', approvedById: req.user?.id, approvedAt: new Date() }
    });
    res.json(updated);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const reqId = req.params.id as string;
    const leave = await prisma.leaveRequest.findUnique({ where: { id: reqId } });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    if (!isAdmin(req.user?.role)) {
      if (leave.employeeId !== req.user?.employeeId) return res.status(403).json({ message: 'You can only revert your own leave' });
      if (leave.status !== 'PENDING') return res.status(400).json({ message: 'Only pending leave can be reverted' });
    }
    await prisma.leaveRequest.delete({ where: { id: reqId } });
    res.json({ message: 'Deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

export default router;
