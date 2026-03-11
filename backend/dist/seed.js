"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    // Create departments
    const departments = await Promise.all([
        prisma.department.upsert({ where: { name: 'Engineering' }, update: {}, create: { name: 'Engineering', description: 'Software development team' } }),
        prisma.department.upsert({ where: { name: 'Human Resources' }, update: {}, create: { name: 'Human Resources', description: 'HR department' } }),
        prisma.department.upsert({ where: { name: 'Marketing' }, update: {}, create: { name: 'Marketing', description: 'Marketing and growth' } }),
        prisma.department.upsert({ where: { name: 'Finance' }, update: {}, create: { name: 'Finance', description: 'Finance and accounting' } }),
        prisma.department.upsert({ where: { name: 'Sales' }, update: {}, create: { name: 'Sales', description: 'Sales team' } }),
    ]);
    // Create positions
    const positions = await Promise.all([
        prisma.position.create({ data: { title: 'Software Engineer', level: 'MID' } }),
        prisma.position.create({ data: { title: 'HR Manager', level: 'SENIOR' } }),
        prisma.position.create({ data: { title: 'Marketing Specialist', level: 'MID' } }),
        prisma.position.create({ data: { title: 'Financial Analyst', level: 'MID' } }),
        prisma.position.create({ data: { title: 'Sales Representative', level: 'JUNIOR' } }),
    ]);
    // Create admin user
    const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'hr@zephrons.com' },
        update: {},
        create: { email: 'hr@zephrons.com', password: await bcryptjs_1.default.hash('CB230025@vb', 10), role: 'HR_MANAGER' }
    });
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@hrm.com' },
        update: {},
        create: { email: 'admin@hrm.com', password: adminPassword, role: 'SUPER_ADMIN' }
    });
    // Create HR employee
    await prisma.employee.upsert({
        where: { email: 'hr@zephrons.com' },
        update: {},
        create: {
            userId: adminUser.id, employeeId: 'EMP0001', firstName: 'HR', lastName: 'Manager',
            email: 'hr@zephrons.com', departmentId: departments[1].id, positionId: positions[1].id,
            joiningDate: new Date('2022-01-01'), salary: 75000, status: 'ACTIVE', employmentType: 'FULL_TIME'
        }
    });
    // Create sample employees
    const sampleEmployees = [
        { first: 'John', last: 'Doe', email: 'john.doe@hrm.com', dept: 0, pos: 0, salary: 65000 },
        { first: 'Jane', last: 'Smith', email: 'jane.smith@hrm.com', dept: 2, pos: 2, salary: 55000 },
        { first: 'Bob', last: 'Johnson', email: 'bob.johnson@hrm.com', dept: 3, pos: 3, salary: 70000 },
        { first: 'Alice', last: 'Brown', email: 'alice.brown@hrm.com', dept: 4, pos: 4, salary: 45000 },
        { first: 'Charlie', last: 'Davis', email: 'charlie.davis@hrm.com', dept: 0, pos: 0, salary: 60000 },
    ];
    for (let i = 0; i < sampleEmployees.length; i++) {
        const emp = sampleEmployees[i];
        const user = await prisma.user.upsert({
            where: { email: emp.email }, update: {},
            create: { email: emp.email, password: adminPassword, role: 'EMPLOYEE' }
        });
        await prisma.employee.upsert({
            where: { email: emp.email }, update: {},
            create: {
                userId: user.id, employeeId: `EMP${String(i + 2).padStart(4, '0')}`,
                firstName: emp.first, lastName: emp.last, email: emp.email,
                departmentId: departments[emp.dept].id, positionId: positions[emp.pos].id,
                joiningDate: new Date('2023-01-01'), salary: emp.salary, status: 'ACTIVE', employmentType: 'FULL_TIME'
            }
        });
    }
    // Create leave types
    await Promise.all([
        prisma.leaveType.upsert({ where: { name: 'Annual Leave' }, update: {}, create: { name: 'Annual Leave', daysAllowed: 21 } }),
        prisma.leaveType.upsert({ where: { name: 'Sick Leave' }, update: {}, create: { name: 'Sick Leave', daysAllowed: 10 } }),
        prisma.leaveType.upsert({ where: { name: 'Maternity Leave' }, update: {}, create: { name: 'Maternity Leave', daysAllowed: 90 } }),
        prisma.leaveType.upsert({ where: { name: 'Emergency Leave' }, update: {}, create: { name: 'Emergency Leave', daysAllowed: 5 } }),
    ]);
    // Create announcements
    await prisma.announcement.createMany({
        data: [
            { title: 'Welcome to HRM System', content: 'Our new HRM system is now live. Please explore all features.', priority: 'HIGH' },
            { title: 'Public Holiday Notice', content: 'Office will be closed on March 15 for public holiday.', priority: 'NORMAL' },
            { title: 'Health Insurance Update', content: 'New health insurance benefits are available from next month.', priority: 'NORMAL' },
        ]
    });
    console.log('Seeding completed!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
