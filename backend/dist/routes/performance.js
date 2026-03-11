"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/', auth_1.authenticate, async (req, res) => {
    const { employeeId, status } = req.query;
    const where = {};
    if (employeeId)
        where.employeeId = employeeId;
    if (status)
        where.status = status;
    const reviews = await prisma.performance.findMany({ where, include: { employee: { select: { firstName: true, lastName: true, employeeId: true, department: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(reviews);
});
router.post('/', auth_1.authenticate, async (req, res) => {
    const review = await prisma.performance.create({ data: req.body, include: { employee: true } });
    res.status(201).json(review);
});
router.put('/:id', auth_1.authenticate, async (req, res) => {
    const review = await prisma.performance.update({ where: { id: req.params.id }, data: req.body });
    res.json(review);
});
exports.default = router;
