import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, page = '1', limit = '10' } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    const [payslips, total] = await Promise.all([
      prisma.payslip.findMany({ where, skip, take: parseInt(limit), include: { employee: { select: { firstName: true, lastName: true, employeeId: true, department: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.payslip.count({ where }),
    ]);
    res.json({ payslips, total });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.body;
    const employees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });
    const payslips = await Promise.all(employees.map(async (emp) => {
      const basic = emp.salary || 0;
      const allowances = basic * 0.1;
      const tax = basic * 0.15;
      const deductions = tax;
      const net = basic + allowances - deductions;
      return prisma.payslip.create({ data: { employeeId: emp.id, month, year, basicSalary: basic, allowances, deductions, tax, netSalary: net, status: 'DRAFT' } });
    }));
    res.status(201).json({ message: `Generated ${payslips.length} payslips`, count: payslips.length });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const payslip = await prisma.payslip.update({ where: { id: req.params.id as string }, data: req.body });
  res.json(payslip);
});

export default router;
