"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/stats', auth_1.authenticate, async (_req, res) => {
    try {
        const [totalEmployees, activeEmployees, departments, pendingLeaves, todayAttendance, openJobs] = await Promise.all([
            prisma.employee.count(),
            prisma.employee.count({ where: { status: 'ACTIVE' } }),
            prisma.department.count(),
            prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
            prisma.attendance.count({ where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
            prisma.jobPosting.count({ where: { status: 'OPEN' } }),
        ]);
        const attendanceRate = totalEmployees > 0 ? Math.round((todayAttendance / totalEmployees) * 100) : 0;
        res.json({ totalEmployees, activeEmployees, departments, pendingLeaves, todayAttendance, openJobs, attendanceRate });
    }
    catch {
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/recent-employees', auth_1.authenticate, async (_req, res) => {
    const employees = await prisma.employee.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { department: true, position: true } });
    res.json(employees);
});
router.get('/department-stats', auth_1.authenticate, async (_req, res) => {
    const departments = await prisma.department.findMany({ include: { _count: { select: { employees: true } } } });
    res.json(departments.map(d => ({ name: d.name, count: d._count.employees })));
});
exports.default = router;
