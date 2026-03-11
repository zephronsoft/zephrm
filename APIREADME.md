# HRM App API Reference

Base URL: `http://localhost:5000/api` (or via frontend proxy at `http://localhost:5175/api`)

All endpoints except `/api/auth/login`, `/api/auth/register`, and `/health` require authentication via `Authorization: Bearer <token>` header.

---

## Auth — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/register` | Register |

---

## Employees — `/api/employees`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees/me` | Current user's profile |
| GET | `/api/employees` | List employees (admin only) |
| GET | `/api/employees/:id` | Get employee by ID |
| POST | `/api/employees` | Create employee (admin only) |
| PUT | `/api/employees/:id` | Update employee (admin only) |
| DELETE | `/api/employees/:id` | Delete employee (admin only) |

---

## Departments — `/api/departments`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List departments |
| POST | `/api/departments` | Create department (admin only) |
| PUT | `/api/departments/:id` | Update department (admin only) |
| DELETE | `/api/departments/:id` | Delete department (admin only) |

---

## Positions — `/api/positions`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/positions` | List positions |

---

## Attendance — `/api/attendance`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance` | List attendance |
| POST | `/api/attendance/clock-in` | Clock in |
| POST | `/api/attendance/clock-out` | Clock out |
| POST | `/api/attendance` | Create attendance record |

---

## Leaves — `/api/leaves`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaves/types` | List leave types |
| POST | `/api/leaves/types` | Create leave type (admin only) |
| GET | `/api/leaves` | List leave requests |
| POST | `/api/leaves` | Create leave request |
| PUT | `/api/leaves/:id/approve` | Approve leave (admin only) |
| PUT | `/api/leaves/:id/reject` | Reject leave (admin only) |
| DELETE | `/api/leaves/:id` | Delete leave request |

---

## Payroll — `/api/payroll`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payroll` | List payslips |
| POST | `/api/payroll/generate` | Generate payslips (admin only) |
| PUT | `/api/payroll/:id` | Update payslip (admin only) |

---

## Performance — `/api/performance`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/performance` | List performance reviews |
| POST | `/api/performance` | Create review (admin only) |
| PUT | `/api/performance/:id` | Update review (admin only) |

---

## Recruitment — `/api/recruitment`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recruitment/jobs` | List job postings |
| POST | `/api/recruitment/jobs` | Create job (admin only) |
| PUT | `/api/recruitment/jobs/:id` | Update job (admin only) |
| GET | `/api/recruitment/applications` | List applications |
| POST | `/api/recruitment/applications` | Submit application |
| PUT | `/api/recruitment/applications/:id` | Update application (admin only) |

---

## Dashboard — `/api/dashboard`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Dashboard stats |
| GET | `/api/dashboard/recent-employees` | Recent employees (admin only) |
| GET | `/api/dashboard/department-stats` | Department stats (admin only) |

---

## Announcements — `/api/announcements`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcements` | List announcements |
| POST | `/api/announcements` | Create announcement (admin only) |

---

## API Status (self-check)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | JSON list of healthy/unhealthy APIs |
| GET | `/status` | HTML page listing healthy vs unhealthy APIs |
| GET | `/status/page` | Same as `/status` |

---

## Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Returns `{ status: "OK" }` (no auth required) |

---

## Admin Roles

Endpoints marked "admin only" require one of: `SUPER_ADMIN`, `ADMIN`, or `HR_MANAGER`.
