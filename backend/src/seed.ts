import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default organization with customize org enabled
  const existingOrg = await prisma.organization.findFirst();
  if (!existingOrg) {
    await prisma.organization.create({ data: { name: 'My Organization', customizeOrg: true } });
  }

  // Create departments
  const departments = await Promise.all([
    prisma.department.upsert({ where: { name: 'Engineering' }, update: {}, create: { name: 'Engineering', description: 'Software development team' } }),
    prisma.department.upsert({ where: { name: 'Human Resources' }, update: {}, create: { name: 'Human Resources', description: 'HR department' } }),
    prisma.department.upsert({ where: { name: 'Marketing' }, update: {}, create: { name: 'Marketing', description: 'Marketing and growth' } }),
    prisma.department.upsert({ where: { name: 'Finance' }, update: {}, create: { name: 'Finance', description: 'Finance and accounting' } }),
    prisma.department.upsert({ where: { name: 'Sales' }, update: {}, create: { name: 'Sales', description: 'Sales team' } }),
  ]);

  // MNC-standard positions (C-suite → VP → Director → Manager → IC, across all functions)
  const positionData = [
    // C-Suite / Executive
    { title: 'Chief Executive Officer (CEO)', level: 'EXECUTIVE' },
    { title: 'Chief Technology Officer (CTO)', level: 'EXECUTIVE' },
    { title: 'Chief Financial Officer (CFO)', level: 'EXECUTIVE' },
    { title: 'Chief Operating Officer (COO)', level: 'EXECUTIVE' },
    { title: 'Chief Human Resources Officer (CHRO)', level: 'EXECUTIVE' },
    { title: 'Chief Marketing Officer (CMO)', level: 'EXECUTIVE' },
    { title: 'Chief Product Officer (CPO)', level: 'EXECUTIVE' },
    { title: 'Chief Revenue Officer (CRO)', level: 'EXECUTIVE' },
    { title: 'Chief Legal Officer (CLO)', level: 'EXECUTIVE' },
    { title: 'Chief Information Officer (CIO)', level: 'EXECUTIVE' },
    { title: 'Chief Data Officer (CDO)', level: 'EXECUTIVE' },
    // Vice President
    { title: 'Vice President (VP)', level: 'EXECUTIVE' },
    { title: 'VP of Engineering', level: 'EXECUTIVE' },
    { title: 'VP of Product', level: 'EXECUTIVE' },
    { title: 'VP of Sales', level: 'EXECUTIVE' },
    { title: 'VP of Marketing', level: 'EXECUTIVE' },
    { title: 'VP of Human Resources', level: 'EXECUTIVE' },
    { title: 'VP of Finance', level: 'EXECUTIVE' },
    { title: 'VP of Operations', level: 'EXECUTIVE' },
    { title: 'VP of Customer Success', level: 'EXECUTIVE' },
    // Director
    { title: 'Director', level: 'SENIOR' },
    { title: 'Director of Engineering', level: 'SENIOR' },
    { title: 'Director of Product', level: 'SENIOR' },
    { title: 'Director of Sales', level: 'SENIOR' },
    { title: 'Director of Marketing', level: 'SENIOR' },
    { title: 'Director of HR', level: 'SENIOR' },
    { title: 'Director of Finance', level: 'SENIOR' },
    { title: 'Director of Operations', level: 'SENIOR' },
    { title: 'Director of IT', level: 'SENIOR' },
    { title: 'Director of Legal', level: 'SENIOR' },
    // Senior Manager
    { title: 'Senior Manager', level: 'SENIOR' },
    { title: 'Engineering Manager', level: 'SENIOR' },
    { title: 'Product Manager', level: 'SENIOR' },
    { title: 'Senior Product Manager', level: 'SENIOR' },
    { title: 'Sales Manager', level: 'SENIOR' },
    { title: 'Regional Sales Manager', level: 'SENIOR' },
    { title: 'Marketing Manager', level: 'SENIOR' },
    { title: 'HR Manager', level: 'SENIOR' },
    { title: 'Finance Manager', level: 'SENIOR' },
    { title: 'Operations Manager', level: 'SENIOR' },
    { title: 'Project Manager', level: 'MID' },
    { title: 'Senior Project Manager', level: 'SENIOR' },
    // Manager
    { title: 'Manager', level: 'MID' },
    { title: 'Team Lead', level: 'MID' },
    { title: 'Tech Lead', level: 'SENIOR' },
    { title: 'Scrum Master', level: 'MID' },
    // Engineering
    { title: 'Principal Engineer', level: 'SENIOR' },
    { title: 'Staff Engineer', level: 'SENIOR' },
    { title: 'Senior Software Engineer', level: 'SENIOR' },
    { title: 'Software Engineer', level: 'MID' },
    { title: 'Software Developer', level: 'MID' },
    { title: 'Frontend Developer', level: 'MID' },
    { title: 'Backend Developer', level: 'MID' },
    { title: 'Full Stack Developer', level: 'MID' },
    { title: 'DevOps Engineer', level: 'MID' },
    { title: 'QA Engineer', level: 'MID' },
    { title: 'Data Engineer', level: 'MID' },
    { title: 'Machine Learning Engineer', level: 'MID' },
    { title: 'Security Engineer', level: 'MID' },
    // Product & Design
    { title: 'Product Designer', level: 'MID' },
    { title: 'UX Designer', level: 'MID' },
    { title: 'UI Designer', level: 'MID' },
    { title: 'Business Analyst', level: 'MID' },
    // HR
    { title: 'HR Business Partner', level: 'SENIOR' },
    { title: 'HR Specialist', level: 'MID' },
    { title: 'Recruiter', level: 'MID' },
    { title: 'Senior Recruiter', level: 'SENIOR' },
    { title: 'Talent Acquisition Specialist', level: 'MID' },
    { title: 'Learning & Development Specialist', level: 'MID' },
    { title: 'Compensation & Benefits Analyst', level: 'MID' },
    // Finance & Accounting
    { title: 'Financial Analyst', level: 'MID' },
    { title: 'Senior Financial Analyst', level: 'SENIOR' },
    { title: 'Accountant', level: 'MID' },
    { title: 'Senior Accountant', level: 'SENIOR' },
    { title: 'Tax Analyst', level: 'MID' },
    { title: 'Auditor', level: 'MID' },
    { title: 'Controller', level: 'SENIOR' },
    // Marketing
    { title: 'Marketing Specialist', level: 'MID' },
    { title: 'Digital Marketing Manager', level: 'SENIOR' },
    { title: 'Content Marketing Specialist', level: 'MID' },
    { title: 'Brand Manager', level: 'SENIOR' },
    { title: 'SEO Specialist', level: 'MID' },
    { title: 'Social Media Manager', level: 'MID' },
    // Sales
    { title: 'Sales Representative', level: 'JUNIOR' },
    { title: 'Account Executive', level: 'MID' },
    { title: 'Senior Account Executive', level: 'SENIOR' },
    { title: 'Business Development Representative (BDR)', level: 'JUNIOR' },
    { title: 'Sales Development Representative (SDR)', level: 'JUNIOR' },
    { title: 'Customer Success Manager', level: 'MID' },
    { title: 'Account Manager', level: 'MID' },
    // Operations & Support
    { title: 'Operations Specialist', level: 'MID' },
    { title: 'Customer Support Representative', level: 'JUNIOR' },
    { title: 'Customer Support Manager', level: 'SENIOR' },
    { title: 'Administrative Assistant', level: 'JUNIOR' },
    { title: 'Executive Assistant', level: 'MID' },
    { title: 'Office Manager', level: 'MID' },
    // Data & Analytics
    { title: 'Data Analyst', level: 'MID' },
    { title: 'Senior Data Analyst', level: 'SENIOR' },
    { title: 'Data Scientist', level: 'MID' },
    { title: 'Business Intelligence Analyst', level: 'MID' },
    // Legal & Compliance
    { title: 'Legal Counsel', level: 'SENIOR' },
    { title: 'Compliance Officer', level: 'SENIOR' },
    { title: 'Paralegal', level: 'MID' },
    // Entry / Junior
    { title: 'Associate', level: 'JUNIOR' },
    { title: 'Junior Developer', level: 'JUNIOR' },
    { title: 'Graduate Trainee', level: 'JUNIOR' },
    { title: 'Intern', level: 'JUNIOR' },
  ];
  for (const p of positionData) {
    const existing = await prisma.position.findFirst({ where: { title: p.title } });
    if (!existing) await prisma.position.create({ data: p });
  }
  const positions = await prisma.position.findMany({ orderBy: { title: 'asc' } });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'hr@zephrons.com' },
    update: {},
    create: { email: 'hr@zephrons.com', password: await bcrypt.hash('CB230025@vb', 10), role: 'HR_MANAGER' }
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@hrm.com' },
    update: {},
    create: { email: 'admin@hrm.com', password: adminPassword, role: 'SUPER_ADMIN' }
  });

  const hrManagerPos = positions.find((p) => p.title === 'HR Manager') || positions[0];
  const softwareEngPos = positions.find((p) => p.title === 'Software Engineer') || positions[0];
  const marketingSpecPos = positions.find((p) => p.title === 'Marketing Specialist') || positions[0];
  const financialAnalystPos = positions.find((p) => p.title === 'Financial Analyst') || positions[0];
  const salesRepPos = positions.find((p) => p.title === 'Sales Representative') || positions[0];

  // Create HR employee
  await prisma.employee.upsert({
    where: { email: 'hr@zephrons.com' },
    update: {},
    create: {
      userId: adminUser.id, employeeId: 'EMP0001', firstName: 'HR', lastName: 'Manager',
      email: 'hr@zephrons.com', departmentId: departments[1].id, positionId: hrManagerPos.id,
      joiningDate: new Date('2022-01-01'), salary: 75000, status: 'ACTIVE', employmentType: 'FULL_TIME'
    }
  });

  // Create Super Admin employee (so they have a profile)
  const ceoPos = positions.find((p) => p.title === 'Chief Executive Officer (CEO)') || positions[0];
  await prisma.employee.upsert({
    where: { email: 'admin@hrm.com' },
    update: {},
    create: {
      userId: superAdmin.id, employeeId: 'EMP0000', firstName: 'Super', lastName: 'Admin',
      email: 'admin@hrm.com', departmentId: departments[0].id, positionId: ceoPos.id,
      joiningDate: new Date('2021-01-01'), salary: 120000, status: 'ACTIVE', employmentType: 'FULL_TIME'
    }
  });

  // Create sample employees
  const sampleEmployees = [
    { first: 'John', last: 'Doe', email: 'john.doe@hrm.com', dept: 0, pos: softwareEngPos, salary: 65000 },
    { first: 'Jane', last: 'Smith', email: 'jane.smith@hrm.com', dept: 2, pos: marketingSpecPos, salary: 55000 },
    { first: 'Bob', last: 'Johnson', email: 'bob.johnson@hrm.com', dept: 3, pos: financialAnalystPos, salary: 70000 },
    { first: 'Alice', last: 'Brown', email: 'alice.brown@hrm.com', dept: 4, pos: salesRepPos, salary: 45000 },
    { first: 'Charlie', last: 'Davis', email: 'charlie.davis@hrm.com', dept: 0, pos: softwareEngPos, salary: 60000 },
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
        departmentId: departments[emp.dept].id, positionId: emp.pos.id,
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

  // Create sample payslips for current month (so employees can see their salary)
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const allEmployees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });
  const existingPayslip = await prisma.payslip.findFirst({ where: { month: currentMonth, year: currentYear } });
  if (!existingPayslip && allEmployees.length > 0) {
    for (const emp of allEmployees) {
      const basic = emp.salary || 0;
      const allowances = basic * 0.1;
      const tax = basic * 0.15;
      const deductions = tax;
      const net = basic + allowances - deductions;
      await prisma.payslip.create({
        data: { employeeId: emp.id, month: currentMonth, year: currentYear, basicSalary: basic, allowances, deductions, tax, netSalary: net, status: 'DRAFT' }
      });
    }
    console.log(`Created ${allEmployees.length} payslips for ${currentMonth}/${currentYear}`);
  }

  console.log('Seeding completed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
