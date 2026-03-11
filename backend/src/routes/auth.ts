import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email }, include: { employee: true } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, employeeId: user.employee?.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' } as any
    );
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, employee: user.employee } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization?.split(' ')[1];
    if (!authHeader) return res.status(401).json({ message: 'Not authenticated' });
    const decoded = jwt.verify(authHeader, process.env.JWT_SECRET!) as { id: string };
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new password required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: decoded.id }, data: { password: hashed } });
    res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid token' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed, role: role || 'EMPLOYEE' } });
    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
