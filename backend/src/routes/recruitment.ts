import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, isAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/jobs', authenticate, async (_req, res: Response) => {
  const jobs = await prisma.jobPosting.findMany({ include: { _count: { select: { applications: true } } }, orderBy: { createdAt: 'desc' } });
  res.json(jobs);
});

router.get('/jobs/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const job = await prisma.jobPosting.findUnique({
    where: { id: req.params.id as string },
    include: { _count: { select: { applications: true } } },
  });
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json(job);
});

router.post('/jobs', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      location,
      type,
      experienceRequired,
      jobSummary,
      responsibilities,
      requiredSkills,
      preferredSkills,
      qualification,
      salary,
      salaryAndBenefits,
      aboutCompany,
      howToApply,
      hrEmail,
      status,
    } = req.body || {};

    const trimmedTitle = String(title || '').trim();
    if (!trimmedTitle) return res.status(400).json({ message: 'Job title is required' });

    const data: any = {
      title: trimmedTitle,
      type: type || 'FULL_TIME',
      status: status || 'OPEN',
    };

    if (location) data.location = String(location).trim();
    if (experienceRequired) data.experienceRequired = String(experienceRequired).trim();
    if (jobSummary) data.jobSummary = String(jobSummary).trim();
    if (responsibilities) data.responsibilities = String(responsibilities).trim();
    if (requiredSkills) data.requiredSkills = String(requiredSkills).trim();
    if (preferredSkills) data.preferredSkills = String(preferredSkills).trim();
    if (qualification) data.qualification = String(qualification).trim();
    if (salary) data.salary = String(salary).trim();
    if (salaryAndBenefits) data.salaryAndBenefits = String(salaryAndBenefits).trim();
    if (aboutCompany) data.aboutCompany = String(aboutCompany).trim();
    if (howToApply) data.howToApply = String(howToApply).trim();
    if (hrEmail) data.hrEmail = String(hrEmail).trim();

    const job = await prisma.jobPosting.create({ data });
    res.status(201).json(job);
  } catch (e: any) {
    console.error('Job create error:', e);
    res.status(500).json({ message: e?.message || 'Failed to create job' });
  }
});

router.put('/jobs/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['title','location','type','experienceRequired','jobSummary','responsibilities',
      'requiredSkills','preferredSkills','qualification','salary','salaryAndBenefits',
      'aboutCompany','howToApply','hrEmail','status'];
    const data: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    const job = await prisma.jobPosting.update({ where: { id: req.params.id as string }, data });
    res.json(job);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to update job' });
  }
});

router.delete('/jobs/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  await prisma.jobPosting.delete({ where: { id: req.params.id as string } });
  res.json({ message: 'Job deleted' });
});

router.get('/applications', authenticate, async (req: AuthRequest, res: Response) => {
  const where: any = {};
  if (!isAdmin(req.user?.role) && req.user?.email) {
    where.email = req.user.email;
  }
  if (req.query.jobId) where.jobPostingId = req.query.jobId as string;
  const apps = await prisma.application.findMany({ where, include: { jobPosting: true }, orderBy: { createdAt: 'desc' } });
  res.json(apps);
});

router.post('/applications', authenticate, async (req: AuthRequest, res: Response) => {
  const app = await prisma.application.create({ data: req.body, include: { jobPosting: true } });
  res.status(201).json(app);
});

router.put('/applications/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  const app = await prisma.application.update({ where: { id: req.params.id as string }, data: req.body });
  res.json(app);
});

export default router;
