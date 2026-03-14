import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const DEFAULT_CHECKLIST = [
  { id: 'offer', label: 'Offer Letter Accepted', done: false },
  { id: 'profile', label: 'Profile Completed', done: false },
  { id: 'docs', label: 'Documents Uploaded', done: false },
  { id: 'bank', label: 'Bank Details Submitted', done: false },
  { id: 'bgv', label: 'Background Verification', done: false },
  { id: 'it', label: 'IT Setup', done: false },
  { id: 'orientation', label: 'Orientation', done: false },
];

const safeParseJsonArray = (value?: string | null, fallback: any[] = []) => {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const mapRecord = (record: any) => ({
  id: record.id,
  employeeId: record.employeeId,
  employee: {
    id: record.employee?.id,
    firstName: record.employee?.firstName,
    lastName: record.employee?.lastName,
    email: record.employee?.email,
    joiningDate: record.employee?.joiningDate,
    status: record.employee?.status,
    offerLetterReleasedAt: record.employee?.offerLetterReleasedAt,
    position: record.employee?.position ? { title: record.employee.position.title } : null,
    department: record.employee?.department ? { name: record.employee.department.name } : null,
    createdAt: record.employee?.createdAt,
  },
  stage: record.stage,
  offerStatus: record.offerStatus,
  docsUploaded: record.docsUploaded,
  docsRequired: record.docsRequired,
  docsVerified: record.docsVerified,
  bgvStatus: record.bgvStatus,
  it: {
    email: record.itEmail,
    laptop: record.itLaptop,
    slack: record.itSlack,
  },
  roleTitle: record.roleTitle,
  departmentName: record.departmentName,
  managerName: record.managerName,
  checklist: safeParseJsonArray(record.checklistJson, DEFAULT_CHECKLIST),
  timeline: safeParseJsonArray(record.timelineJson, []),
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

router.get('/records', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (_req: AuthRequest, res: Response) => {
  try {
    const inactiveEmployees = await prisma.employee.findMany({
      where: { status: 'INACTIVE' },
      include: { department: true, position: true, onboardingRecord: true },
      orderBy: { createdAt: 'desc' },
    });

    for (const emp of inactiveEmployees) {
      if (!emp.onboardingRecord) {
        await prisma.onboardingRecord.create({
          data: {
            employeeId: emp.id,
            roleTitle: emp.position?.title || null,
            departmentName: emp.department?.name || null,
            checklistJson: JSON.stringify(DEFAULT_CHECKLIST),
            timelineJson: JSON.stringify([{ id: `t-${emp.id}-1`, date: new Date().toISOString().slice(0, 10), label: 'Candidate Added', done: true }]),
          },
        });
      }
    }

    const records = await prisma.onboardingRecord.findMany({
      where: { employee: { status: 'INACTIVE' } },
      include: { employee: { include: { department: true, position: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(records.map(mapRecord));
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Failed to fetch onboarding records' });
  }
});

router.post('/records', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = String(req.body?.employeeId || '').trim();
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required' });

    const emp = await prisma.employee.findUnique({ where: { id: employeeId }, include: { department: true, position: true } });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });

    const record = await prisma.onboardingRecord.upsert({
      where: { employeeId },
      update: {
        roleTitle: req.body?.roleTitle ?? emp.position?.title ?? undefined,
        departmentName: req.body?.departmentName ?? emp.department?.name ?? undefined,
        managerName: req.body?.managerName ?? undefined,
      },
      create: {
        employeeId,
        roleTitle: req.body?.roleTitle ?? emp.position?.title ?? null,
        departmentName: req.body?.departmentName ?? emp.department?.name ?? null,
        managerName: req.body?.managerName ?? null,
        checklistJson: JSON.stringify(DEFAULT_CHECKLIST),
        timelineJson: JSON.stringify([{ id: `t-${employeeId}-1`, date: new Date().toISOString().slice(0, 10), label: 'Candidate Added', done: true }]),
      },
      include: { employee: { include: { department: true, position: true } } },
    });

    return res.status(201).json(mapRecord(record));
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Failed to create onboarding record' });
  }
});

router.put('/records/by-employee/:employeeId', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.params.employeeId as string;
    const existing = await prisma.onboardingRecord.findUnique({ where: { employeeId } });
    if (!existing) return res.status(404).json({ message: 'Onboarding record not found' });

    const data: any = {};
    const assign = (key: string, value: any) => { if (value !== undefined) data[key] = value; };

    assign('stage', req.body?.stage);
    assign('offerStatus', req.body?.offerStatus);
    assign('docsUploaded', req.body?.docsUploaded);
    assign('docsRequired', req.body?.docsRequired);
    assign('docsVerified', req.body?.docsVerified);
    assign('bgvStatus', req.body?.bgvStatus);
    assign('itEmail', req.body?.it?.email ?? req.body?.itEmail);
    assign('itLaptop', req.body?.it?.laptop ?? req.body?.itLaptop);
    assign('itSlack', req.body?.it?.slack ?? req.body?.itSlack);
    assign('roleTitle', req.body?.roleTitle);
    assign('departmentName', req.body?.departmentName);
    assign('managerName', req.body?.managerName);

    if (req.body?.checklist !== undefined) assign('checklistJson', JSON.stringify(req.body.checklist || []));
    if (req.body?.timeline !== undefined) assign('timelineJson', JSON.stringify(req.body.timeline || []));

    const updated = await prisma.onboardingRecord.update({
      where: { employeeId },
      data,
      include: { employee: { include: { department: true, position: true } } },
    });

    return res.json(mapRecord(updated));
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Failed to update onboarding record' });
  }
});

export default router;
