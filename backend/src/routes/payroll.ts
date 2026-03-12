import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, isAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, page = '1', limit = '10' } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (!isAdmin(req.user?.role)) {
      let employeeId = req.user?.employeeId;
      if (!employeeId && req.user?.email) {
        const emp = await prisma.employee.findUnique({ where: { email: req.user.email } });
        employeeId = emp?.id;
      }
      if (!employeeId) return res.json({ payslips: [], total: 0 });
      where.employeeId = employeeId;
    }
    const [payslips, total] = await Promise.all([
      prisma.payslip.findMany({ where, skip, take: parseInt(limit), include: { employee: { select: { id: true, firstName: true, lastName: true, email: true, employeeId: true, department: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.payslip.count({ where }),
    ]);
    res.json({ payslips, total });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/generate', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.body;
    const employees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });
    if (employees.length === 0) {
      return res.json({ message: 'No active employees found', count: 0 });
    }

    // Find which employees already have a payslip for this month/year
    const existing = await prisma.payslip.findMany({
      where: { month, year, employeeId: { in: employees.map(e => e.id) } },
      select: { employeeId: true },
    });
    const existingIds = new Set(existing.map(p => p.employeeId));
    const missing = employees.filter(e => !existingIds.has(e.id));

    if (missing.length === 0) {
      return res.json({ message: `Payroll already generated for all ${employees.length} employees this period`, count: 0 });
    }

    const payslips = await Promise.all(missing.map(emp => {
      const basic = emp.salary || 0;
      const allowances = basic * 0.1;
      const tax = basic * 0.15;
      const deductions = tax;
      const net = basic + allowances - deductions;
      return prisma.payslip.create({ data: { employeeId: emp.id, month, year, basicSalary: basic, allowances, deductions, tax, netSalary: net, status: 'DRAFT' } });
    }));

    const skipped = existingIds.size;
    const msg = skipped > 0
      ? `Generated ${payslips.length} new payslip${payslips.length !== 1 ? 's' : ''} (${skipped} already existed)`
      : `Generated ${payslips.length} payslip${payslips.length !== 1 ? 's' : ''}`;
    res.status(201).json({ message: msg, count: payslips.length });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  const data: any = {};
  if (req.body.basicSalary != null) data.basicSalary = Number(req.body.basicSalary);
  if (req.body.allowances != null) data.allowances = Number(req.body.allowances);
  if (req.body.deductions != null) data.deductions = Number(req.body.deductions);
  if (req.body.tax != null) data.tax = Number(req.body.tax);
  if (req.body.netSalary != null) data.netSalary = Number(req.body.netSalary);
  if (req.body.status != null) {
    data.status = req.body.status;
    data.paidAt = req.body.status === 'PAID' ? new Date() : null;
  }
  const payslip = await prisma.payslip.update({ where: { id: req.params.id as string }, data });
  res.json(payslip);
});

router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  await prisma.payslip.delete({ where: { id: req.params.id as string } });
  res.json({ message: 'Payslip deleted' });
});

export default router;
