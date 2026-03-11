"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const { month, year, page = '1', limit = '10' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (month)
            where.month = parseInt(month);
        if (year)
            where.year = parseInt(year);
        const [payslips, total] = await Promise.all([
            prisma.payslip.findMany({ where, skip, take: parseInt(limit), include: { employee: { select: { firstName: true, lastName: true, employeeId: true, department: true } } }, orderBy: { createdAt: 'desc' } }),
            prisma.payslip.count({ where }),
        ]);
        res.json({ payslips, total });
    }
    catch {
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/generate', auth_1.authenticate, async (req, res) => {
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
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
router.put('/:id', auth_1.authenticate, async (req, res) => {
    const payslip = await prisma.payslip.update({ where: { id: req.params.id }, data: req.body });
    res.json(payslip);
});
exports.default = router;
