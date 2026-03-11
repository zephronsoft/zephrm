import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, authorize, isAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'Welcome@123';

// Helper to convert date string to ISO DateTime (returns undefined for invalid)
const toDateTime = (d: any): Date | undefined => {
  if (!d) return undefined;
  if (d instanceof Date) return isNaN(d.getTime()) ? undefined : d;
  const s = String(d).trim();
  if (!s) return undefined;
  const parsed = s.includes('T') ? new Date(s) : new Date(s + 'T00:00:00.000Z');
  return isNaN(parsed.getTime()) ? undefined : parsed;
};


router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let emp = req.user?.employeeId
      ? await prisma.employee.findUnique({
          where: { id: req.user.employeeId },
          include: { department: true, position: true, manager: true, user: { select: { email: true, role: true } } }
        })
      : null;
    if (!emp && req.user?.email) {
      emp = await prisma.employee.findUnique({
        where: { email: req.user.email },
        include: { department: true, position: true, manager: true, user: { select: { email: true, role: true } } }
      });
    }
    if (!emp) return res.status(404).json({ message: 'No employee profile linked to your account' });
    res.json(emp);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string;
    const department = req.query.department as string;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeId: { contains: search } },
      ];
    }
    if (department) where.departmentId = department;
    if (status) where.status = status;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where, skip, take: limit,
        include: { department: true, position: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count({ where }),
    ]);
    res.json({ employees, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!isAdmin(req.user?.role) && req.user?.employeeId !== id) {
      return res.status(403).json({ message: 'You can only view your own profile' });
    }
    const emp = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true, position: true, manager: true,
        user: { select: { email: true, role: true } }
      }
    });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json(emp);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      joiningDate,
      leavingDate,
      dateOfBirth,
      salary,
      departmentId,
      positionId,
      managerId,
      status,
      employmentType,
      gender,
      address,
      city,
      country,
    } = req.body;

    const emailStr = String(email || '').trim().toLowerCase();
    if (!emailStr) return res.status(400).json({ message: 'Email is required' });
    if (!firstName?.trim()) return res.status(400).json({ message: 'First name is required' });
    if (!lastName?.trim()) return res.status(400).json({ message: 'Last name is required' });

    const existingUserWithEmp = await prisma.user.findUnique({
      where: { email: emailStr },
      include: { employee: true },
    });
    if (existingUserWithEmp?.employee) {
      return res.status(400).json({ message: 'A user with this email already has an employee record' });
    }

    const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const count = await prisma.employee.count();
    const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;

    const empData: Record<string, unknown> = {
      user: existingUserWithEmp
        ? { connect: { id: existingUserWithEmp.id } }
        : { create: { email: emailStr, password: hashed, role: 'EMPLOYEE' } },
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: emailStr,
      employeeId,
      joiningDate: toDateTime(joiningDate) || new Date(),
      employmentType: employmentType || 'FULL_TIME',
      status: status || 'ACTIVE',
    };
    if (phone !== undefined && phone !== null && String(phone).trim()) empData.phone = String(phone).trim();
    if (leavingDate) empData.leavingDate = toDateTime(leavingDate);
    if (dateOfBirth) empData.dateOfBirth = toDateTime(dateOfBirth);
    if (salary !== undefined && salary !== null && salary !== '') {
      const num = parseFloat(salary);
      if (!isNaN(num) && num >= 0) empData.salary = num;
    }
    if (departmentId) empData.department = { connect: { id: departmentId } };
    if (positionId) empData.position = { connect: { id: positionId } };
    if (managerId) empData.manager = { connect: { id: managerId } };
    if (gender) empData.gender = String(gender).trim();
    if (address) empData.address = String(address).trim();
    if (city) empData.city = String(city).trim();
    if (country) empData.country = String(country).trim();

    const emp = await prisma.employee.create({
      data: empData as any,
      include: { department: true, position: true },
    });
    res.status(201).json({ ...emp, _defaultPassword: DEFAULT_PASSWORD });
  } catch (e: any) {
    console.error('Employee create error:', e);
    const msg = e.message || 'Failed to create employee';
    res.status(400).json({ message: msg });
  }
});

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body || {};
    const id = req.params.id as string;
    const raw: Record<string, unknown> = {};

    if (body.firstName !== undefined) raw.firstName = String(body.firstName).trim();
    if (body.lastName !== undefined) raw.lastName = String(body.lastName).trim();
    if (body.email !== undefined) raw.email = String(body.email).trim().toLowerCase();
    if (body.phone !== undefined) raw.phone = body.phone === '' ? null : String(body.phone).trim();
    if (body.gender !== undefined) raw.gender = body.gender === '' ? null : String(body.gender).trim();
    if (body.address !== undefined) raw.address = body.address === '' ? null : String(body.address).trim();
    if (body.city !== undefined) raw.city = body.city === '' ? null : String(body.city).trim();
    if (body.country !== undefined) raw.country = body.country === '' ? null : String(body.country).trim();
    if (body.status !== undefined) raw.status = body.status || 'ACTIVE';
    if (body.employmentType !== undefined) raw.employmentType = body.employmentType || 'FULL_TIME';

    const jd = toDateTime(body.joiningDate);
    if (jd) raw.joiningDate = jd;
    const ld = toDateTime(body.leavingDate);
    if (body.leavingDate !== undefined) raw.leavingDate = ld || null;
    const dob = toDateTime(body.dateOfBirth);
    if (dob) raw.dateOfBirth = dob;

    if (body.salary !== undefined && body.salary !== '') {
      const n = parseFloat(String(body.salary));
      raw.salary = isNaN(n) || n < 0 ? null : n;
    }
    if (body.departmentId !== undefined) raw.departmentId = body.departmentId === '' ? null : body.departmentId;
    if (body.positionId !== undefined) raw.positionId = body.positionId === '' ? null : body.positionId;
    if (body.managerId !== undefined) raw.managerId = body.managerId === '' ? null : body.managerId;

    // Remove undefined - Prisma rejects undefined in update data
    const data = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;

    const emp = await prisma.employee.update({
      where: { id },
      data,
      include: { department: true, position: true }
    });
    res.json(emp);
  } catch (e: any) {
    console.error('Employee update error:', e?.code, e?.message, e?.meta, e?.stack);
    if (e?.code === 'P2025') return res.status(404).json({ message: 'Employee not found' });
    if (e?.code === 'P2002') return res.status(400).json({ message: 'Email already in use by another employee' });
    if (e?.code === 'P2003') return res.status(400).json({ message: 'Invalid department or position selected' });
    if (e?.code === 'P2017') return res.status(400).json({ message: 'Relation already disconnected' });
    const msg = e?.meta?.cause || e?.message || 'Failed to update employee';
    res.status(500).json({ message: msg });
  }
});

router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Employee deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

export default router;
