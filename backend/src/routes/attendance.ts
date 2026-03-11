import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, month, year, page = '1', limit = '20' } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (!isAdmin(req.user?.role) && req.user?.employeeId) where.employeeId = req.user.employeeId;
    else if (employeeId) where.employeeId = employeeId;
    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0);
      where.date = { gte: start, lte: end };
    }
    const [records, total] = await Promise.all([
      prisma.attendance.findMany({ where, skip, take: parseInt(limit), include: { employee: { select: { firstName: true, lastName: true, employeeId: true, avatar: true } } }, orderBy: { date: 'desc' } }),
      prisma.attendance.count({ where }),
    ]);
    res.json({ records, total });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/clock-in', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const empId = isAdmin(req.user?.role) ? req.body.employeeId : req.user?.employeeId;
    if (!empId) return res.status(400).json({ message: 'Employee not linked to your account' });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await prisma.attendance.findFirst({ where: { employeeId: empId, date: today } });
    if (existing) return res.status(400).json({ message: 'Already clocked in today' });
    const record = await prisma.attendance.create({ data: { employeeId: empId, date: today, clockIn: new Date(), status: 'PRESENT' } });
    res.status(201).json(record);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/clock-out', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const empId = isAdmin(req.user?.role) ? req.body.employeeId : req.user?.employeeId;
    if (!empId) return res.status(400).json({ message: 'Employee not linked to your account' });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const record = await prisma.attendance.findFirst({ where: { employeeId: empId, date: today } });
    if (!record) return res.status(404).json({ message: 'No clock-in found' });
    const clockOut = new Date();
    const workHours = record.clockIn ? (clockOut.getTime() - record.clockIn.getTime()) / 3600000 : 0;
    const updated = await prisma.attendance.update({ where: { id: record.id }, data: { clockOut, workHours } });
    res.json(updated);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = isAdmin(req.user?.role) ? req.body : { ...req.body, employeeId: req.user?.employeeId };
    if (!data.employeeId) return res.status(400).json({ message: 'Employee not linked to your account' });
    const record = await prisma.attendance.create({ data });
    res.status(201).json(record);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

export default router;
