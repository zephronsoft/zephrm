import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { authenticate } from './middleware/auth';
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import departmentRoutes from './routes/departments';
import positionRoutes from './routes/positions';
import attendanceRoutes from './routes/attendance';
import leaveRoutes from './routes/leaves';
import payrollRoutes from './routes/payroll';
import performanceRoutes from './routes/performance';
import recruitmentRoutes from './routes/recruitment';
import dashboardRoutes from './routes/dashboard';
import announcementRoutes from './routes/announcements';
import resignationRoutes from './routes/resignations';
import apiStatusRoutes, { statusPageHandler } from './routes/apiStatus';
import mailerRoutes from './routes/mailer';
import onboardingRoutes from './routes/onboarding';

dotenv.config();

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:80', 'http://localhost', 'http://127.0.0.1:80', 'http://127.0.0.1'];
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API status page - register early
app.get('/status', statusPageHandler);
app.get('/status/page', statusPageHandler);

// Direct route for positions (Express 5 router mounting can fail for GET / on mounted router)
const prisma = new PrismaClient();
const LEVEL_ORDER: Record<string, number> = { EXECUTIVE: 0, SENIOR: 1, MID: 2, JUNIOR: 3 };
app.get('/api/positions', authenticate, async (_req, res) => {
  try {
    const positions = await prisma.position.findMany({ orderBy: { title: 'asc' } });
    positions.sort((a: any, b: any) => {
      const aLevel = LEVEL_ORDER[a.level || 'MID'] ?? 2;
      const bLevel = LEVEL_ORDER[b.level || 'MID'] ?? 2;
      return aLevel !== bLevel ? aLevel - bLevel : (a.title || '').localeCompare(b.title || '');
    });
    res.json(positions);
  } catch (e: any) {
    console.error('Positions fetch error:', e?.message);
    res.status(500).json({ message: e?.message || 'Failed to fetch positions' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
// positionRoutes kept for any future /api/positions/* routes
app.use('/api/positions', positionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/resignations', resignationRoutes);
app.use('/api/status', apiStatusRoutes);
app.use('/api/mailer', mailerRoutes);
app.use('/api/onboarding', onboardingRoutes);

app.get('/api/organization', authenticate, async (_req, res) => {
  try {
    let org = await prisma.organization.findFirst();
    if (!org) org = await prisma.organization.create({ data: { name: 'My Organization' } });
    res.json(org);
  } catch (e: any) { res.status(500).json({ message: e?.message }); }
});

app.put('/api/organization', authenticate, async (req: any, res) => {
  try {
    const allowed = ['name', 'currency', 'customizeOrg'];
    const data: any = {};
    for (const k of allowed) if (req.body[k] !== undefined) data[k] = req.body[k];
    let org = await prisma.organization.findFirst();
    if (!org) org = await prisma.organization.create({ data: { name: 'My Organization', ...data } });
    else org = await prisma.organization.update({ where: { id: org.id }, data });
    res.json(org);
  } catch (e: any) { res.status(500).json({ message: e?.message }); }
});

app.get('/health', (req, res) => res.json({ status: 'OK' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`HRM Server running on port ${PORT}`));

export default app;
