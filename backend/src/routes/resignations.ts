import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const HR_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const REVIEWER_ROLES = [...HR_ADMIN_ROLES, 'MANAGER'];
const DEFAULT_NOTICE_PERIOD_DAYS = 60;

const isHrAdmin = (role?: string) => !!role && HR_ADMIN_ROLES.includes(role);
const canReview = (role?: string) => !!role && REVIEWER_ROLES.includes(role);

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const role = req.user.role;
    const employeeId = req.user.employeeId;

    let where: any = {};

    if (isHrAdmin(role)) {
      where = {};
    } else if (role === 'MANAGER') {
      if (!employeeId) return res.status(403).json({ message: 'Manager employee profile missing' });
      where = { employee: { managerId: employeeId } };
    } else {
      if (!employeeId) return res.status(403).json({ message: 'Employee profile missing' });
      where = { employeeId };
    }

    const resignations = await prisma.resignation.findMany({
      where,
      include: {
        employee: {
          include: {
            manager: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(resignations);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to fetch resignations' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.employeeId) return res.status(403).json({ message: 'Employee profile required' });

    const { reason, lastWorkingDate } = req.body || {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const defaultLastWorkingDate = new Date(today);
    defaultLastWorkingDate.setDate(defaultLastWorkingDate.getDate() + DEFAULT_NOTICE_PERIOD_DAYS);

    const parsedDate = lastWorkingDate ? new Date(lastWorkingDate) : defaultLastWorkingDate;

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: 'Reason is required' });
    }
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Valid last working date is required' });
    }
    if (parsedDate < today) {
      return res.status(400).json({ message: 'Last working date cannot be before current date' });
    }

    const resignation = await prisma.resignation.create({
      data: {
        employeeId: req.user.employeeId,
        reason: String(reason).trim(),
        noticePeriodDays: DEFAULT_NOTICE_PERIOD_DAYS,
        lastWorkingDate: parsedDate,
      },
      include: {
        employee: true,
      },
    });

    res.status(201).json(resignation);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to submit resignation' });
  }
});

router.patch('/:id/admin-update', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!isHrAdmin(req.user?.role)) {
      return res.status(403).json({ message: 'Only HR/Admin can update resignation details' });
    }

    const resignationId = String(req.params.id);
    const resignation = await prisma.resignation.findUnique({ where: { id: resignationId } });
    if (!resignation) return res.status(404).json({ message: 'Resignation not found' });

    const { reason, lastWorkingDate, noticePeriodDays } = req.body || {};
    const data: any = {};

    if (reason !== undefined) {
      if (!String(reason).trim()) return res.status(400).json({ message: 'Reason cannot be empty' });
      data.reason = String(reason).trim();
    }

    if (noticePeriodDays !== undefined) {
      const parsedNotice = Number(noticePeriodDays);
      if (!Number.isFinite(parsedNotice) || parsedNotice < 1 || parsedNotice > 365) {
        return res.status(400).json({ message: 'Notice period must be between 1 and 365 days' });
      }
      data.noticePeriodDays = Math.floor(parsedNotice);
    }

    if (lastWorkingDate !== undefined && lastWorkingDate !== null && String(lastWorkingDate).trim() !== '') {
      const parsedDate = new Date(lastWorkingDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Valid last working date is required' });
      }
      data.lastWorkingDate = parsedDate;
    } else if (data.noticePeriodDays !== undefined) {
      const baseDate = new Date(resignation.submittedAt);
      const recalculated = new Date(baseDate);
      recalculated.setDate(recalculated.getDate() + data.noticePeriodDays);
      data.lastWorkingDate = recalculated;
    }

    const updated = await prisma.resignation.update({
      where: { id: resignationId },
      data,
      include: {
        employee: {
          include: {
            manager: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to update resignation details' });
  }
});

router.patch('/:id/review', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!canReview(req.user.role)) return res.status(403).json({ message: 'Only manager/HR/admin can review' });

    const { status, reviewNote } = req.body || {};
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be APPROVED or REJECTED' });
    }

    const resignationId = String(req.params.id);
    const resignation = await prisma.resignation.findUnique({ where: { id: resignationId } });

    if (!resignation) return res.status(404).json({ message: 'Resignation not found' });

    const resignationEmployee = await prisma.employee.findUnique({
      where: { id: resignation.employeeId },
      select: { id: true, managerId: true },
    });
    if (!resignationEmployee) return res.status(404).json({ message: 'Employee not found for this resignation' });

    const isManagerForEmployee = req.user.role === 'MANAGER' && !!req.user.employeeId && resignationEmployee.managerId === req.user.employeeId;
    const isHrOrAdmin = isHrAdmin(req.user.role);

    if (!isManagerForEmployee && !isHrOrAdmin) {
      return res.status(403).json({ message: 'Only assigned manager or HR/admin can review this resignation' });
    }

    if (!req.user.employeeId) {
      return res.status(403).json({ message: 'Reviewer employee profile missing' });
    }

    const updated = await prisma.resignation.update({
      where: { id: resignation.id },
      data: {
        status,
        reviewNote: reviewNote ? String(reviewNote).trim() : null,
        reviewedById: req.user.employeeId,
        reviewedAt: new Date(),
      },
      include: {
        employee: {
          include: {
            manager: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to review resignation' });
  }
});

export default router;
