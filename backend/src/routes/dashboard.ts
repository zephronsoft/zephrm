import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/stats', authenticate, async (_req, res: Response) => {
  try {
    const [totalEmployees, activeEmployees, departments, pendingLeaves, todayAttendance, openJobs] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.department.count(),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.attendance.count({ where: { date: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
      prisma.jobPosting.count({ where: { status: 'OPEN' } }),
    ]);
    const attendanceRate = totalEmployees > 0 ? Math.round((todayAttendance / totalEmployees) * 100) : 0;
    res.json({ totalEmployees, activeEmployees, departments, pendingLeaves, todayAttendance, openJobs, attendanceRate });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/recent-employees', authenticate, async (_req, res: Response) => {
  const employees = await prisma.employee.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { department: true, position: true } });
  res.json(employees);
});

router.get('/department-stats', authenticate, async (_req, res: Response) => {
  const departments = await prisma.department.findMany({ include: { _count: { select: { employees: true } } } });
  res.json(departments.map(d => ({ name: d.name, count: d._count.employees })));
});

export default router;
