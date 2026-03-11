"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/', auth_1.authenticate, async (_req, res) => {
    const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
    res.json(announcements);
});
router.post('/', auth_1.authenticate, async (req, res) => {
    const ann = await prisma.announcement.create({ data: { ...req.body, createdById: req.user?.id } });
    res.status(201).json(ann);
});
exports.default = router;
