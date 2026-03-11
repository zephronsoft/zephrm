"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/', auth_1.authenticate, async (_req, res) => {
    const departments = await prisma.department.findMany({ include: { _count: { select: { employees: true } } } });
    res.json(departments);
});
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const dept = await prisma.department.create({ data: req.body });
        res.status(201).json(dept);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
router.put('/:id', auth_1.authenticate, async (req, res) => {
    const dept = await prisma.department.update({ where: { id: req.params.id }, data: req.body });
    res.json(dept);
});
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
});
exports.default = router;
