"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Helper to convert date string to ISO DateTime
const toDateTime = (d) => {
    if (!d)
        return undefined;
    if (d instanceof Date)
        return d;
    const s = String(d);
    return s.includes('T') ? new Date(s) : new Date(s + 'T00:00:00.000Z');
};
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const search = req.query.search;
        const department = req.query.department;
        const status = req.query.status;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { employeeId: { contains: search } },
            ];
        }
        if (department)
            where.departmentId = department;
        if (status)
            where.status = status;
        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where, skip, take: limit,
                include: { department: true, position: true },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.employee.count({ where }),
        ]);
        res.json({ employees, total, page, totalPages: Math.ceil(total / limit) });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const emp = await prisma.employee.findUnique({
            where: { id: req.params.id },
            include: {
                department: true, position: true, manager: true,
                user: { select: { email: true, role: true } }
            }
        });
        if (!emp)
            return res.status(404).json({ message: 'Employee not found' });
        res.json(emp);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { joiningDate, leavingDate, dateOfBirth, salary, departmentId, positionId, managerId, ...rest } = req.body;
        const count = await prisma.employee.count();
        const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
        const data = {
            ...rest,
            employeeId,
            joiningDate: toDateTime(joiningDate),
        };
        if (leavingDate)
            data.leavingDate = toDateTime(leavingDate);
        if (dateOfBirth)
            data.dateOfBirth = toDateTime(dateOfBirth);
        if (salary !== undefined && salary !== '')
            data.salary = parseFloat(salary);
        if (departmentId)
            data.departmentId = departmentId;
        if (positionId)
            data.positionId = positionId;
        if (managerId)
            data.managerId = managerId;
        const emp = await prisma.employee.create({
            data,
            include: { department: true, position: true }
        });
        res.status(201).json(emp);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
router.put('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { joiningDate, leavingDate, dateOfBirth, salary, departmentId, positionId, managerId, employeeId, userId, user, department, position, ...rest } = req.body;
        const data = { ...rest };
        if (joiningDate)
            data.joiningDate = toDateTime(joiningDate);
        if (leavingDate)
            data.leavingDate = toDateTime(leavingDate);
        if (dateOfBirth)
            data.dateOfBirth = toDateTime(dateOfBirth);
        if (salary !== undefined && salary !== '')
            data.salary = parseFloat(salary);
        if (departmentId !== undefined)
            data.departmentId = departmentId || null;
        if (positionId !== undefined)
            data.positionId = positionId || null;
        if (managerId !== undefined)
            data.managerId = managerId || null;
        const emp = await prisma.employee.update({
            where: { id: req.params.id },
            data,
            include: { department: true, position: true }
        });
        res.json(emp);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        await prisma.employee.delete({ where: { id: req.params.id } });
        res.json({ message: 'Employee deleted' });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.default = router;
