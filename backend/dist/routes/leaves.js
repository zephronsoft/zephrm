"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const toDateTime = (d) => {
    if (!d)
        return undefined;
    const s = String(d);
    return s.includes('T') ? new Date(s) : new Date(s + 'T00:00:00.000Z');
};
router.get('/types', auth_1.authenticate, async (_req, res) => {
    const types = await prisma.leaveType.findMany();
    res.json(types);
});
router.post('/types', auth_1.authenticate, async (req, res) => {
    try {
        const type = await prisma.leaveType.create({ data: req.body });
        res.status(201).json(type);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const employeeId = req.query.employeeId;
        const status = req.query.status;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '20');
        const skip = (page - 1) * limit;
        const where = {};
        if (employeeId)
            where.employeeId = employeeId;
        if (status)
            where.status = status;
        const [requests, total] = await Promise.all([
            prisma.leaveRequest.findMany({
                where, skip, take: limit,
                include: {
                    employee: { select: { firstName: true, lastName: true, employeeId: true } },
                    leaveType: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.leaveRequest.count({ where }),
        ]);
        res.json({ requests, total });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { startDate, endDate, days, ...rest } = req.body;
        const request = await prisma.leaveRequest.create({
            data: {
                ...rest,
                startDate: toDateTime(startDate),
                endDate: toDateTime(endDate),
                days: parseInt(String(days)),
            },
            include: { leaveType: true, employee: { select: { firstName: true, lastName: true } } }
        });
        res.status(201).json(request);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
router.put('/:id/approve', auth_1.authenticate, async (req, res) => {
    try {
        const updated = await prisma.leaveRequest.update({
            where: { id: req.params.id },
            data: { status: 'APPROVED', approvedById: req.user?.id, approvedAt: new Date() }
        });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
router.put('/:id/reject', auth_1.authenticate, async (req, res) => {
    try {
        const updated = await prisma.leaveRequest.update({
            where: { id: req.params.id },
            data: { status: 'REJECTED', approvedById: req.user?.id, approvedAt: new Date() }
        });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        await prisma.leaveRequest.delete({ where: { id: req.params.id } });
        res.json({ message: 'Deleted' });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.default = router;
