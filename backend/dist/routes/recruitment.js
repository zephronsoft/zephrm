"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/jobs', auth_1.authenticate, async (_req, res) => {
    const jobs = await prisma.jobPosting.findMany({ include: { _count: { select: { applications: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(jobs);
});
router.post('/jobs', auth_1.authenticate, async (req, res) => {
    const job = await prisma.jobPosting.create({ data: req.body });
    res.status(201).json(job);
});
router.put('/jobs/:id', auth_1.authenticate, async (req, res) => {
    const job = await prisma.jobPosting.update({ where: { id: req.params.id }, data: req.body });
    res.json(job);
});
router.get('/applications', auth_1.authenticate, async (_req, res) => {
    const apps = await prisma.application.findMany({ include: { jobPosting: true }, orderBy: { createdAt: 'desc' } });
    res.json(apps);
});
router.post('/applications', auth_1.authenticate, async (req, res) => {
    const app = await prisma.application.create({ data: req.body, include: { jobPosting: true } });
    res.status(201).json(app);
});
router.put('/applications/:id', auth_1.authenticate, async (req, res) => {
    const app = await prisma.application.update({ where: { id: req.params.id }, data: req.body });
    res.json(app);
});
exports.default = router;
