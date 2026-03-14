import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';
import { authenticate, authorize, isAdmin, AuthRequest } from '../middleware/auth';
import { sendNewJoinerCredentialsEmail } from '../lib/mailer';

const router = Router();
const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'Welcome@123';

// Helper to convert date string to ISO DateTime (returns undefined for invalid)
const toDateTime = (d: any): Date | undefined => {
  if (!d) return undefined;
  if (d instanceof Date) return isNaN(d.getTime()) ? undefined : d;
  const s = String(d).trim();
  if (!s) return undefined;
  const parsed = s.includes('T') ? new Date(s) : new Date(s + 'T00:00:00.000Z');
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

const formatDateLong = (value?: Date | string | null) => {
  if (!value) return '[DD Month YYYY]';
  const dt = value instanceof Date ? value : new Date(value);
  if (isNaN(dt.getTime())) return '[DD Month YYYY]';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

const fmtINR = (val: string | number) => {
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.]/g, '')) || 0 : val || 0;
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const buildOfferLetterContent = (params: {
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    joiningDate: Date;
    department?: { name?: string | null } | null;
    position?: { title?: string | null } | null;
  };
  companyName: string;
  companyAddress: string;
  companyWebsite: string;
  companyPhone: string;
  companyRegNo: string;
  hrEmail: string;
  referenceNo: string;
  offerDate: string;
  jobTitle: string;
  department: string;
  managerDesignation: string;
  workLocation: string;
  annualCtc: string;
  probationMonths: string;
  noticePeriodDays: string;
  offerValidTill: string;
  // Candidate info
  candidateSalutation: string;
  candidateAddress: string;
  candidateCity: string;
  candidateState: string;
  candidatePinCode: string;
  // Signatory
  authorizedSignatoryName: string;
  authorizedSignatoryDesignation: string;
  // Salary structure
  basicMonthly: string;
  hraMonthly: string;
  specialAllowanceMonthly: string;
  grossMonthly: string;
  epfEmployeeMonthly: string;
  esiEmployeeMonthly: string;
  professionalTaxMonthly: string;
  totalDeductionsMonthly: string;
  netMonthlySalary: string;
  epfEmployerMonthly: string;
  esiEmployerMonthly: string;
  totalEmployerContributionMonthly: string;
  totalCtcMonthly: string;
  totalCtcAnnual: string;
}) => {
  const fullName = `${params.employee.firstName} ${params.employee.lastName}`.trim();
  const salutation = params.candidateSalutation || 'Mr. / Ms.';
  const joiningDate = formatDateLong(params.employee.joiningDate);

  return `${params.companyName}
${params.companyAddress}
Email: ${params.hrEmail}  |  Website: ${params.companyWebsite}  |  Phone: ${params.companyPhone}
Reg. No.: ${params.companyRegNo}

---

Ref: ${params.referenceNo}
Date: ${params.offerDate}

---

${salutation} ${fullName}
${params.candidateAddress},
${params.candidateCity}, ${params.candidateState},
India. PIN: ${params.candidatePinCode}

---

Offer of Employment

Dear ${salutation} ${params.employee.lastName},

Further to our discussions, we are pleased to appoint you as ${params.jobTitle} with ${params.companyName}, as per the terms and conditions stated below:

---

1. Your offer letter is valid till ${params.offerValidTill} and you are required to confirm acceptance of the offer and join on ${joiningDate}. If you do not confirm your acceptance, this offer is treated as withdrawn. To confirm your acceptance of this offer, you are required to respond via email to ${params.hrEmail}.

---

2. Reporting and Responsibilities:

You will report to the undersigned and complete the joining formalities. Your working location will be at ${params.workLocation}. We will communicate you about your reporting manager on joining the organization and completing the joining formalities.

Note: On your joining date, please bring Soft copies of (i) the original offer letter duly signed and dated by you; (ii) Passport size photograph (Soft copy), (iii) the originals and 1 set of soft copies of the following documents:
- Education degree certificate
- Relieving letter or resignation acceptance letter from your most recent employer
- Proof of identity: AADHAR card/Passport and PAN card (mandatory)

Please note that all the above documents are mandatory, and you will not be allowed to join without them.

---

3. Compensation

During your probation period, you will be eligible for a compensation of ${params.annualCtc} per annum as CTC (Cost to Company) as mentioned in the Annexure III. Your compensation and other benefits shall be subject to deductions of all Governmental and local taxes, statutory contributions as required under the laws of India.

---

4. Working Hours

a. Your working hours are from 9:30 am to 6:30 pm, Monday to Friday
b. The Company reserves the right to require you to work outside your normal working hours if necessary, in furtherance of your duties.
c. You will be eligible for leave and other benefits as per the rules of the company.

---

5. Responsibilities

You must effectively, diligently and to the best of your ability perform all responsibilities and duties and ensure successful completion of the assignments given to you time to time by your reporting manager.

---

6. Non-Disclosure Obligations and Intellectual Property

At all times during and after your employment, you will hold in strictest confidence and not use for your own purposes or the purposes of others or disclose anything on the intellectual property belonging to the Company as defined in the Annexure I (Intellectual Property), to any person, firm, corporation or third party, without prior authorization in writing by the Company.

You agree that the results and proceeds of your services hereunder, including any works of authorship resulting from your services during your employment, shall be works-made-for-hire and the Company shall be deemed the sole and exclusive owner throughout the universe in perpetuity of any and all rights of whatsoever nature therein.

---

7. Confidentiality

In consideration of the opportunities, training and access to new techniques and know-how that will be made available to you, you will be required to comply with the confidentiality policy of the Company. Therefore, please ensure that you maintain as secret the confidential information as defined in Annexure II (Confidential Information) and shall not use or divulge or disclose any such Confidential Information except as may be required under obligation of law.

---

8. Company Property

Any and all memoranda, notes, records, books, other documents, art works, circular, files, items of equipment, laptops, parts of PC of the Company made or composed by you or which might be supplied or made available to you in connection with your work during the employment, shall at all times remain the property of the Company and shall be returned upon your ceasing to be in the Company's employment.

---

9. Notice of Change

Any change in your personal information including residential address, marital status, number of children and education qualification should be notified to the Company in writing within 7 days.

---

10. Termination

a. During the probation period, either party may terminate this contract by giving 30 days notice in writing or payment in lieu of salary (net of provident fund contribution). However, the Company reserves the right not to accept payment in lieu of notice.
b. Your employment may be terminated forthwith by the Company without prior notice if any declaration or information given by you is found to be false or untrue.
c. The Company shall have the right to terminate your services without any notice or salary in lieu thereof for misconduct, negligence of duty, disloyalty, dishonesty, indiscipline, disobedience, or irregular attendance.
d. Without limiting the general effect of clause 10(c), if you absent yourself without leave, you shall be considered as having voluntarily terminated your employment without giving any notice.
e. After your confirmation, the notice period for both sides shall be ${params.noticePeriodDays} days or pay in lieu of the same. Failure from employee's side will compel the Company to take necessary legal action.
f. Upon separation from the company, you shall hand over all company property under your custody to your reporting manager.

---

11. Exclusivity / Prior Commitment

Unless prior written agreement is given to you by the Company, you agree to work exclusively for the Company within the context of the responsibilities defined above, and not to accept or perform any other paid or unpaid employment or consulting in addition to this, even temporary.

---

12. Non-Compete / Non-Solicit

Non-Competition: You covenant and agree that, during the term of your employment with the Company and for twelve (12) months after the termination thereof, regardless of the reason for the employment termination, you will not, directly or indirectly, anywhere in the Territory, on behalf of any Competitive Business perform the same or substantially the same Job Duties which is directly in competition with the Company.

Non-Solicitation of Customers: You covenant and agree that during the term of your employment and for twelve months after termination, you will not, directly or indirectly, solicit any business from any of the Company's Customers, Customer Prospects, or Vendors with whom you had Material Contact during the last two years of your employment.

Non-Solicitation of Employees: You covenant and agree that during the term of your employment and for twelve months after termination, you will not recruit, solicit, or induce any non-clerical employee of the Company with whom you had personal contact to terminate their employment with the Company.

---

13. Notices

All notices required to be given hereunder shall be given in writing, by personal delivery or by mail at the respective addresses of the parties hereto. In the case of the Company:
${params.companyName}, ${params.companyAddress}  or Email to: ${params.hrEmail}

---

14. Jurisdiction

The jurisdiction concerning this contract will be with the courts in Telangana which you undertake to not contest. The contract shall be governed by and interpreted in accordance with the laws of India.

---

With best wishes,

For ${params.companyName}


__________________________________
${params.authorizedSignatoryName}
${params.authorizedSignatoryDesignation}

---

Candidate Undertaking

I have carefully read and understood the terms and conditions mentioned above and in the Annexure I and II attached.

I acknowledge that while I am working for ${params.companyName}, I will take proper care of all company equipment that I am entrusted with. I further understand that upon termination, I will return all company property in proper working order.

I accept all the terms and conditions mentioned therein. I shall commence my probation with effect from __________________

Name: __________________     Date: __________________     Signature: __________________

---

---

Annexure I — Intellectual Property

The term 'Intellectual Property' or 'Company owned property' as it is used in this schedule, shall include, but not be limited to the following:

1. Business or financial records, strategies, patents, patent applications, trademarks, trade secrets, forecasts, budgets, projections, Licenses, prices of products and services, Clients list, Goodwill, Personnel information, and other information regarding formulas, patterns, compilations, programs.

2. All work created and/or developed by you solely or as a team during your work hours on our premises and/or using Company labour resources, equipment, software and/or facilities shall be deemed to be Company's intellectual property. (This includes but is not limited to: patents; trademarks; trade secrets; copyrights; inventions; improvements; reports; techniques; discoveries; methods; processes; models; designs; technology; know-how; software programs; art assets; artwork; paintings; drawings; sketches; ideas or information made and practiced by the Company.)

3. All materials provided to or created by you solely or as part of a team during your work hours on our premises is deemed to be owned by the Company. (This includes but is not limited to: all motion pictures; films; software programs; software and hardware related to any interactive devices; storage media such as CD-ROM; interactive cable; fiber optic; any other computer-based system; and instruments required for drawing and painting.)

Name: __________________     Date: __________________     Signature: __________________

---

Annexure II — Confidential Information

"Confidential Information" includes but is not limited to information which is or fairly can be considered to be of a confidential nature, and includes all Intellectual Property (as defined in Annexure I), including:

i. Information of value or significance to the Company, its subsidiaries, affiliates, customers or competitors, such as:
   - Customer data — key contact names, addresses, sales figures and conditions
   - Business data — new products, promotion campaigns, distribution strategies, license agreements
   - Software data — software modules and devices designed to prevent unauthorized copying
   - Research and development data — software and hardware development information
   - Financial data — budgets, fees, revenue calculations, sales figures, financial statements
   - Procedures for computer access and passwords
   - Lists of personnel seeking employment or already employed by the Company
   - Any and all other information of a commercially sensitive nature relating to the Company's operations

ii. Original information supplied by the Company

iii. Information not known to competitors nor intended for general dissemination

iv. Any business or technical information relating to the Company

v. Any copies of the above-mentioned information

Does NOT include:
a. Information that is in the public domain (other than by your breach of this contract)
b. Information previously known to you and in your possession prior to the date of this contract
c. Information lawfully obtained by you from a third party
d. Information developed independently by you without reference to the Company's Confidential Information

Name: __________________     Date: __________________     Signature: __________________

---

Annexure III — Compensation Structure

HR NOTE: Salary structure as agreed for ${fullName} — ${params.jobTitle}

Candidate Details:
| Field            | Details                  |
| Name             | ${fullName}              |
| Designation      | ${params.jobTitle}       |
| Department       | ${params.department}     |
| Location         | ${params.workLocation}   |

Salary Structure:
| Salary Component                            | Monthly (INR)                                |
| Basic                                       | ${fmtINR(params.basicMonthly)}               |
| House Rent Allowance (HRA)                  | ${fmtINR(params.hraMonthly)}                 |
| Special Allowance                           | ${fmtINR(params.specialAllowanceMonthly)}    |
| Gross Monthly Salary                        | ${fmtINR(params.grossMonthly)}               |
|                                             |                                              |
| Deductions                                  |                                              |
| Employee Contribution to EPF (12% of Basic) | ${fmtINR(params.epfEmployeeMonthly)}         |
| Employee Contribution to ESI                | ${fmtINR(params.esiEmployeeMonthly)}         |
| Professional Tax                            | ${fmtINR(params.professionalTaxMonthly)}     |
| Total Deductions                            | ${fmtINR(params.totalDeductionsMonthly)}     |
| Net Monthly Salary (before TDS)             | ${fmtINR(params.netMonthlySalary)}           |
|                                             |                                              |
| Employer Contribution                       |                                              |
| EPF (Employer 12% of Basic)                 | ${fmtINR(params.epfEmployerMonthly)}         |
| ESI (Employer)                              | ${fmtINR(params.esiEmployerMonthly)}         |
| Total Employer Contribution (Monthly)       | ${fmtINR(params.totalEmployerContributionMonthly)} |
|                                             |                                              |
| Total Fixed CTC (Per Month)                 | ${fmtINR(params.totalCtcMonthly)}            |
| Total Fixed CTC (Per Annum)                 | ${fmtINR(params.totalCtcAnnual)}             |
| Total CTC (Per Annum) [Rounded Off]         | ${params.annualCtc}                          |

NOTE:
1. For any queries regarding your salary structure please send an email to: ${params.hrEmail}
2. Gratuity is a retirement benefit credited to the employee and eligible as per gratuity policy.
3. Performance based Incentive is payable monthly after completion of probation. Performance evaluation will be carried out once in 6 months.

For: ${params.companyName}


__________________________________
${params.authorizedSignatoryName}
${params.authorizedSignatoryDesignation}

Date: __________________

---

This document is confidential and intended solely for the named recipient.
${params.companyName}  |  ${params.hrEmail}  |  ${params.companyAddress}`;
};

// ── Keep old signature as alias so existing usages still compile ──────────────
// (release endpoint below passes all new fields)

const buildOfferLetterContentLegacy = (params: {
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    joiningDate: Date;
    department?: { name?: string | null } | null;
    position?: { title?: string | null } | null;
  };
  companyName: string;
  companyAddress: string;
  companyWebsite: string;
  companyPhone: string;
  companyRegNo: string;
  hrEmail: string;
  referenceNo: string;
  offerDate: string;
  jobTitle: string;
  department: string;
  managerDesignation: string;
  workLocation: string;
  annualCtc: string;
  probationMonths: string;
  noticePeriodDays: string;
  offerValidTill: string;
}) => {
  const fullName = `${params.employee.firstName} ${params.employee.lastName}`.trim();
  return `# OFFER LETTER

---

**${params.companyName}**
Corporate Headquarters: ${params.companyAddress}
Tel: ${params.companyPhone} | HR Email: ${params.hrEmail} | Website: ${params.companyWebsite}
CIN / Registration No.: ${params.companyRegNo}

---

**Date:** ${params.offerDate}

**Reference No.:** ${params.referenceNo}

---

**To,**

**${fullName}**
Email: ${params.employee.email}

---

## Subject: Offer of Employment — ${params.jobTitle}

---

Dear **${params.employee.firstName}**, 

We are delighted to extend this offer of employment to you on behalf of **${params.companyName}** ("the Company"). After careful evaluation of your qualifications, experience, and interview performance, we are pleased to confirm your selection for the position detailed below.

This offer is subject to the terms and conditions set forth in this letter and will be governed by the Company's policies and procedures as amended from time to time.

---

## 1. POSITION DETAILS

| Parameter            | Details                                      |
|----------------------|----------------------------------------------|
| **Designation**      | ${params.jobTitle}                           |
| **Department**       | ${params.department}                         |
| **Band / Grade**     | [Band / Grade]                               |
| **Reporting To**     | ${params.managerDesignation}                 |
| **Employment Type**  | Full-Time, Permanent                         |
| **Work Location**    | ${params.workLocation}                       |
| **Date of Joining**  | ${formatDateLong(params.employee.joiningDate)} |

---

## 2. COMPENSATION & BENEFITS

### 2.1 Annual Cost to Company (CTC)

Your total annual Cost to Company (CTC) will be **${params.annualCtc}**.

### 2.2 Salary Structure (Monthly Breakdown)

| Component                          | Monthly (INR/USD) | Annual (INR/USD) |
|------------------------------------|-------------------|------------------|
| Basic Salary                       | [Amount]          | [Amount]         |
| House Rent Allowance (HRA)         | [Amount]          | [Amount]         |
| Transport / Conveyance Allowance   | [Amount]          | [Amount]         |
| Medical Allowance                  | [Amount]          | [Amount]         |
| Special Allowance                  | [Amount]          | [Amount]         |
| **Gross Salary**                   | **[Amount]**      | **[Amount]**     |
| Provident Fund – Employer (12%)    | [Amount]          | [Amount]         |
| Gratuity (4.81%)                   | [Amount]          | [Amount]         |
| **Total CTC**                      | **[Amount]**      | **[Amount]**     |

> **Note:** Salary will be credited on or before the last working day of every month via bank transfer.

### 2.3 Variable Pay / Performance Bonus

You will be eligible for an annual performance bonus as per company policy and business performance.

### 2.4 Employee Benefits

You will be entitled to applicable benefits including insurance, PF, gratuity, and leave encashment as per policy.

---

## 3. LEAVE ENTITLEMENT

| Leave Type                  | Days Per Annum       |
|-----------------------------|----------------------|
| Earned Leave (EL)           | [18] days            |
| Sick Leave (SL)             | [8] days             |
| Casual Leave (CL)           | [6] days             |
| Maternity / Paternity Leave | As per applicable law|
| Public / National Holidays  | [10–12] days         |

---

## 4. PROBATION PERIOD

Your initial probation period will be **${params.probationMonths} months** from your date of joining. During this period, your performance, conduct, and suitability for the role will be assessed.

Either party may terminate employment during the probation period with written notice as per policy.

---

## 5. NOTICE PERIOD

Post confirmation, the notice period for resignation or termination shall be **${params.noticePeriodDays} calendar days**.

---

## 6. CONFIDENTIALITY & NON-DISCLOSURE

As a condition of your employment, you will be required to sign a **Non-Disclosure Agreement (NDA)** and adhere to the Company's Information Security Policy.

---

## 7. INTELLECTUAL PROPERTY

All inventions, works, developments, designs, software, or processes created by you in the scope of your employment shall be the sole intellectual property of the Company.

---

## 8. NON-COMPETE & NON-SOLICITATION

During your employment and for a limited period after cessation, you agree not to solicit employees/clients or engage in restricted competitive conduct, as permitted by applicable law.

---

## 9. CODE OF CONDUCT

You are expected to uphold the Company's values and comply with all policies. Violation may result in disciplinary action, including termination.

---

## 10. PRE-JOINING REQUIREMENTS

Please complete required documents and declarations before or on your joining date.

---

## 11. BACKGROUND VERIFICATION

This offer is contingent upon successful completion of pre-employment background verification.

---

## 12. RELOCATION ASSISTANCE

[If applicable] Relocation support may be provided as per company policy.

---

## 13. GENERAL TERMS

- This offer supersedes prior discussions or representations.
- This offer does not constitute employment for a fixed term unless explicitly stated.
- Employment is subject to the Employee Handbook, HR Policies, and applicable laws.

---

## 14. OFFER VALIDITY & ACCEPTANCE

This offer is **valid until ${params.offerValidTill}**. Please sign and return a copy of this letter as your formal acceptance.

To accept this offer, please:
1. Sign and share the duly signed copy with HR
2. Send acceptance to: **${params.hrEmail}**

---

Yours sincerely,

**________________________**
**[Authorized Signatory Name]**
[Designation]
${params.companyName}
Date: _______________

---

## CANDIDATE ACCEPTANCE

I, **${fullName}**, hereby accept the offer of employment extended by **${params.companyName}** on the terms and conditions stated in this letter.

**Signature:** ________________________

**Name:** ${fullName}

**Date:** ________________________

**Place:** ________________________

---

*This document is confidential and intended solely for the named recipient. Any unauthorized reproduction, distribution, or disclosure is strictly prohibited.*`;
};

const createOfferLetterPdf = async (title: string, content: string) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.info.Title = title;
    doc.font('Helvetica-Bold').fontSize(18).text(title, { align: 'center' });
    doc.moveDown();

    const lines = String(content || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.replace(/^#{1,6}\s*/, '').replace(/^>\s*/, ''));

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        doc.moveDown(0.6);
        continue;
      }

      if (/^---+$/.test(trimmed)) {
        doc.moveDown(0.3);
        doc.moveTo(doc.x, doc.y).lineTo(555, doc.y).strokeColor('#cbd5e1').stroke();
        doc.moveDown(0.6);
        continue;
      }

      const isSection = /^\d+\./.test(trimmed) || /^Subject:/.test(trimmed);
      const isEmphasis = /^\*\*/.test(trimmed) || /^\|/.test(trimmed);
      doc.font(isSection ? 'Helvetica-Bold' : 'Helvetica').fontSize(isSection ? 12 : isEmphasis ? 10.5 : 10);
      doc.fillColor('#0f172a').text(trimmed.replace(/\*\*/g, ''), { width: 515, lineGap: 2 });
      doc.moveDown(0.2);
    }

    doc.end();
  });
};


router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let emp = req.user?.employeeId
      ? await prisma.employee.findUnique({
          where: { id: req.user.employeeId },
          include: { department: true, position: true, manager: true, user: { select: { email: true, role: true } } }
        })
      : null;
    if (!emp && req.user?.email) {
      emp = await prisma.employee.findUnique({
        where: { email: req.user.email },
        include: { department: true, position: true, manager: true, user: { select: { email: true, role: true } } }
      });
    }
    if (!emp) return res.status(404).json({ message: 'No employee profile linked to your account' });
    res.json(emp);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.get('/me/offer-letter', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let emp = req.user?.employeeId
      ? await prisma.employee.findUnique({ where: { id: req.user.employeeId } })
      : null;

    if (!emp && req.user?.email) {
      emp = await prisma.employee.findUnique({ where: { email: req.user.email } });
    }

    if (!emp) return res.status(404).json({ message: 'No employee profile linked to your account' });
    if (!emp.offerLetterReleasedAt || !emp.offerLetterContent) {
      return res.status(404).json({ message: 'Offer letter has not been released yet' });
    }

    return res.json({
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
      referenceNo: emp.offerLetterRefNo,
      releasedAt: emp.offerLetterReleasedAt,
      content: emp.offerLetterContent,
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Failed to fetch offer letter' });
  }
});

router.get('/me/offer-letter.pdf', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let emp = req.user?.employeeId
      ? await prisma.employee.findUnique({ where: { id: req.user.employeeId } })
      : null;

    if (!emp && req.user?.email) {
      emp = await prisma.employee.findUnique({ where: { email: req.user.email } });
    }

    if (!emp) return res.status(404).json({ message: 'No employee profile linked to your account' });
    if (!emp.offerLetterReleasedAt || !emp.offerLetterContent) {
      return res.status(404).json({ message: 'Offer letter has not been released yet' });
    }

    const fileName = `${emp.firstName}-${emp.lastName}-offer-letter.pdf`.replace(/\s+/g, '-').toLowerCase();
    const pdf = await createOfferLetterPdf('Offer Letter', emp.offerLetterContent);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    return res.send(pdf);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Failed to render offer letter PDF' });
  }
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string;
    const department = req.query.department as string;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeId: { contains: search } },
      ];
    }
    if (department) where.departmentId = department;
    if (status) {
      where.status = status;
    } else {
      where.status = { not: 'INACTIVE' };
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where, skip, take: limit,
        include: { department: true, position: true, user: { select: { id: true, role: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count({ where }),
    ]);
    res.json({ employees, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!isAdmin(req.user?.role) && req.user?.employeeId !== id) {
      return res.status(403).json({ message: 'You can only view your own profile' });
    }
    const emp = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true, position: true, manager: true,
        user: { select: { email: true, role: true } }
      }
    });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json(emp);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.get('/:id/offer-letter', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!isAdmin(req.user?.role) && req.user?.employeeId !== id) {
      return res.status(403).json({ message: 'You can only view your own offer letter' });
    }

    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    if (!emp.offerLetterReleasedAt || !emp.offerLetterContent) {
      return res.status(404).json({ message: 'Offer letter has not been released yet' });
    }

    return res.json({
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
      referenceNo: emp.offerLetterRefNo,
      releasedAt: emp.offerLetterReleasedAt,
      content: emp.offerLetterContent,
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Failed to fetch offer letter' });
  }
});

router.get('/:id/offer-letter.pdf', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!isAdmin(req.user?.role) && req.user?.employeeId !== id) {
      return res.status(403).json({ message: 'You can only view your own offer letter' });
    }

    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    if (!emp.offerLetterReleasedAt || !emp.offerLetterContent) {
      return res.status(404).json({ message: 'Offer letter has not been released yet' });
    }

    const fileName = `${emp.firstName}-${emp.lastName}-offer-letter.pdf`.replace(/\s+/g, '-').toLowerCase();
    const pdf = await createOfferLetterPdf('Offer Letter', emp.offerLetterContent);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    return res.send(pdf);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Failed to render offer letter PDF' });
  }
});

// ── Shared helper: build offer-letter params from request body + employee DB row ─
const buildOfferParams = (
  employee: { firstName: string; lastName: string; email: string; joiningDate: Date; department?: { name?: string | null } | null; position?: { title?: string | null } | null; managerId?: string | null },
  body: Record<string, any>,
  org: { name?: string | null } | null,
  referenceNo: string,
  offerDate: string,
  offerValidTill: string,
) => {
  const b = body || {};
  const jobTitle = String(b.jobTitle || employee.position?.title || 'Employee');
  const department = String(b.department || employee.department?.name || 'General');
  const workLocation = String(b.workLocation || 'Hyderabad');

  const basic = parseFloat(String(b.basicMonthly || '0')) || 0;
  const hra = parseFloat(String(b.hraMonthly || '0')) || 0;
  const special = parseFloat(String(b.specialAllowanceMonthly || '0')) || 0;
  const gross = parseFloat(String(b.grossMonthly || String(basic + hra + special))) || (basic + hra + special);
  const epfEmp = parseFloat(String(b.epfEmployeeMonthly || String(Math.min(Math.round(basic * 0.12), 1800)))) || Math.min(Math.round(basic * 0.12), 1800);
  const esiEmp = parseFloat(String(b.esiEmployeeMonthly || '0')) || 0;
  const pt = parseFloat(String(b.professionalTaxMonthly || '200')) || 200;
  const totalDed = parseFloat(String(b.totalDeductionsMonthly || String(epfEmp + esiEmp + pt))) || (epfEmp + esiEmp + pt);
  const netMonthly = parseFloat(String(b.netMonthlySalary || String(gross - totalDed))) || (gross - totalDed);
  const epfEr = parseFloat(String(b.epfEmployerMonthly || String(epfEmp))) || epfEmp;
  const esiEr = parseFloat(String(b.esiEmployerMonthly || '0')) || 0;
  const totalEr = parseFloat(String(b.totalEmployerContributionMonthly || String(epfEr + esiEr))) || (epfEr + esiEr);
  const totalCtcM = parseFloat(String(b.totalCtcMonthly || String(gross + totalEr))) || (gross + totalEr);
  const totalCtcA = parseFloat(String(b.totalCtcAnnual || String(totalCtcM * 12))) || (totalCtcM * 12);

  const annualCtcDisplay = b.annualCtc
    ? String(b.annualCtc)
    : `INR ${totalCtcA.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return {
    employee,
    companyName: String(b.companyName || org?.name || 'Zephron Tech Lab Pvt. Ltd.'),
    companyAddress: String(b.companyAddress || 'Kukatpalli, HYDERABAD, TELANGANA – 500081'),
    companyWebsite: String(b.companyWebsite || 'www.zephrons.com'),
    companyPhone: String(b.companyPhone || ''),
    companyRegNo: String(b.companyRegNo || ''),
    hrEmail: String(b.hrEmail || process.env.MAIL_FROM_ADDRESS || 'hr@zephrons.com'),
    referenceNo,
    offerDate,
    offerValidTill,
    jobTitle,
    department,
    managerDesignation: String(b.managerDesignation || employee.managerId || 'Reporting Manager'),
    workLocation,
    annualCtc: annualCtcDisplay,
    probationMonths: String(b.probationMonths || '6'),
    noticePeriodDays: String(b.noticePeriodDays || '60'),
    candidateSalutation: String(b.candidateSalutation || 'Mr. / Ms.'),
    candidateAddress: String(b.candidateAddress || ''),
    candidateCity: String(b.candidateCity || ''),
    candidateState: String(b.candidateState || ''),
    candidatePinCode: String(b.candidatePinCode || ''),
    authorizedSignatoryName: String(b.authorizedSignatoryName || 'Chandrayudu Birru'),
    authorizedSignatoryDesignation: String(b.authorizedSignatoryDesignation || 'Director'),
    basicMonthly: String(basic),
    hraMonthly: String(hra),
    specialAllowanceMonthly: String(special),
    grossMonthly: String(gross),
    epfEmployeeMonthly: String(epfEmp),
    esiEmployeeMonthly: String(esiEmp),
    professionalTaxMonthly: String(pt),
    totalDeductionsMonthly: String(totalDed),
    netMonthlySalary: String(netMonthly),
    epfEmployerMonthly: String(epfEr),
    esiEmployerMonthly: String(esiEr),
    totalEmployerContributionMonthly: String(totalEr),
    totalCtcMonthly: String(totalCtcM),
    totalCtcAnnual: String(totalCtcA),
  };
};

// ── Preview endpoint — generates PDF without saving to DB ────────────────────
router.post('/:id/offer-letter/preview', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { department: true, position: true },
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const org = await prisma.organization.findFirst();
    const year = new Date().getFullYear();
    const offerDate = formatDateLong(req.body?.offerDate || new Date());
    const offerValidTill = formatDateLong(req.body?.offerValidTill || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);
    const releasedCount = await prisma.employee.count({
      where: { offerLetterReleasedAt: { gte: yearStart, lte: yearEnd } },
    });
    const referenceNo = String(req.body?.referenceNo || `HR/OL/${year}/${String(releasedCount + 1).padStart(4, '0')}`);

    const params = buildOfferParams(employee, req.body || {}, org, referenceNo, offerDate, offerValidTill);
    const content = buildOfferLetterContent(params);
    const firstName = employee.firstName || 'candidate';
    const lastName = employee.lastName || '';
    const fileName = `${firstName}-${lastName}-offer-preview.pdf`.replace(/\s+/g, '-').toLowerCase();

    const pdf = await createOfferLetterPdf('Offer Letter — Preview', content);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    return res.send(pdf);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Failed to generate preview' });
  }
});

router.post('/:id/offer-letter/release', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { department: true, position: true },
    });

    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const org = await prisma.organization.findFirst();
    const year = new Date().getFullYear();
    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);

    // Reuse existing reference number to prevent duplicate ref numbers on double-submit
    let referenceNo: string;
    if (req.body?.referenceNo) {
      referenceNo = String(req.body.referenceNo);
    } else if ((employee as any).offerLetterRefNo) {
      // Re-release: keep the same reference number, just update content/salary
      referenceNo = String((employee as any).offerLetterRefNo);
    } else {
      const releasedCount = await prisma.employee.count({
        where: { offerLetterReleasedAt: { gte: yearStart, lte: yearEnd } },
      });
      referenceNo = `HR/OL/${year}/${String(releasedCount + 1).padStart(4, '0')}`;
    }

    const offerDate = formatDateLong(req.body?.offerDate || new Date());
    const offerValidTill = formatDateLong(req.body?.offerValidTill || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    const params = buildOfferParams(employee, req.body || {}, org, referenceNo, offerDate, offerValidTill);
    const content = buildOfferLetterContent(params);

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        offerLetterRefNo: referenceNo,
        offerLetterContent: content,
        offerLetterReleasedAt: new Date(),
      },
    });

    return res.json({
      message: 'Offer letter released successfully',
      employeeId: updated.id,
      referenceNo: updated.offerLetterRefNo,
      releasedAt: updated.offerLetterReleasedAt,
      content: updated.offerLetterContent,
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Failed to release offer letter' });
  }
});

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      joiningDate,
      leavingDate,
      dateOfBirth,
      salary,
      departmentId,
      positionId,
      managerId,
      status,
      employmentType,
      gender,
      address,
      city,
      country,
    } = req.body;

    const emailStr = String(email || '').trim().toLowerCase();
    if (!emailStr) return res.status(400).json({ message: 'Email is required' });
    if (!firstName?.trim()) return res.status(400).json({ message: 'First name is required' });
    if (!lastName?.trim()) return res.status(400).json({ message: 'Last name is required' });

    const existingUserWithEmp = await prisma.user.findUnique({
      where: { email: emailStr },
      include: { employee: true },
    });
    if (existingUserWithEmp?.employee) {
      return res.status(400).json({ message: 'A user with this email already has an employee record' });
    }

    const creatingNewUser = !existingUserWithEmp;
    const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const count = await prisma.employee.count();
    const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;

    const empData: Record<string, unknown> = {
      user: existingUserWithEmp
        ? { connect: { id: existingUserWithEmp.id } }
        : { create: { email: emailStr, password: hashed, role: 'EMPLOYEE' } },
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: emailStr,
      employeeId,
      joiningDate: toDateTime(joiningDate) || new Date(),
      employmentType: employmentType || 'FULL_TIME',
      status: status || 'ACTIVE',
    };
    if (phone !== undefined && phone !== null && String(phone).trim()) empData.phone = String(phone).trim();
    if (leavingDate) empData.leavingDate = toDateTime(leavingDate);
    if (dateOfBirth) empData.dateOfBirth = toDateTime(dateOfBirth);
    if (salary !== undefined && salary !== null && salary !== '') {
      const num = parseFloat(salary);
      if (!isNaN(num) && num >= 0) empData.salary = num;
    }
    if (departmentId) empData.department = { connect: { id: departmentId } };
    if (positionId) empData.position = { connect: { id: positionId } };
    if (managerId) empData.manager = { connect: { id: managerId } };
    if (gender) empData.gender = String(gender).trim();
    if (address) empData.address = String(address).trim();
    if (city) empData.city = String(city).trim();
    if (country) empData.country = String(country).trim();

    const emp = await prisma.employee.create({
      data: empData as any,
      include: { department: true, position: true },
    });

    let emailDelivery: any = { sent: false, skipped: true, reason: 'Existing user reused' };
    if (creatingNewUser) {
      try {
        emailDelivery = await sendNewJoinerCredentialsEmail({
          email: emp.email,
          fullName: `${emp.firstName} ${emp.lastName}`.trim(),
          password: DEFAULT_PASSWORD,
        });
      } catch (mailErr: any) {
        console.error('Employee welcome email error:', mailErr?.message);
        emailDelivery = { sent: false, skipped: false, reason: mailErr?.message || 'SMTP delivery failed' };
      }
    }

    res.status(201).json({ ...emp, _defaultPassword: DEFAULT_PASSWORD, _emailDelivery: emailDelivery });
  } catch (e: any) {
    console.error('Employee create error:', e);
    const msg = e.message || 'Failed to create employee';
    res.status(400).json({ message: msg });
  }
});

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body || {};
    const id = req.params.id as string;
    const raw: Record<string, unknown> = {};

    if (body.firstName !== undefined) raw.firstName = String(body.firstName).trim();
    if (body.lastName !== undefined) raw.lastName = String(body.lastName).trim();
    if (body.email !== undefined) raw.email = String(body.email).trim().toLowerCase();
    if (body.phone !== undefined) raw.phone = body.phone === '' ? null : String(body.phone).trim();
    if (body.gender !== undefined) raw.gender = body.gender === '' ? null : String(body.gender).trim();
    if (body.address !== undefined) raw.address = body.address === '' ? null : String(body.address).trim();
    if (body.city !== undefined) raw.city = body.city === '' ? null : String(body.city).trim();
    if (body.country !== undefined) raw.country = body.country === '' ? null : String(body.country).trim();
    if (body.status !== undefined) raw.status = body.status || 'ACTIVE';
    if (body.employmentType !== undefined) raw.employmentType = body.employmentType || 'FULL_TIME';

    const jd = toDateTime(body.joiningDate);
    if (jd) raw.joiningDate = jd;
    const ld = toDateTime(body.leavingDate);
    if (body.leavingDate !== undefined) raw.leavingDate = ld || null;
    const dob = toDateTime(body.dateOfBirth);
    if (dob) raw.dateOfBirth = dob;

    if (body.salary !== undefined && body.salary !== '') {
      const n = parseFloat(String(body.salary));
      raw.salary = isNaN(n) || n < 0 ? null : n;
    }
    if (body.departmentId !== undefined) raw.departmentId = body.departmentId === '' ? null : body.departmentId;
    if (body.positionId !== undefined) raw.positionId = body.positionId === '' ? null : body.positionId;
    if (body.managerId !== undefined) raw.managerId = body.managerId === '' ? null : body.managerId;

    // Remove undefined - Prisma rejects undefined in update data
    const data = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;

    const emp = await prisma.employee.update({
      where: { id },
      data,
      include: { department: true, position: true }
    });
    res.json(emp);
  } catch (e: any) {
    console.error('Employee update error:', e?.code, e?.message, e?.meta, e?.stack);
    if (e?.code === 'P2025') return res.status(404).json({ message: 'Employee not found' });
    if (e?.code === 'P2002') return res.status(400).json({ message: 'Email already in use by another employee' });
    if (e?.code === 'P2003') return res.status(400).json({ message: 'Invalid department or position selected' });
    if (e?.code === 'P2017') return res.status(400).json({ message: 'Relation already disconnected' });
    const msg = e?.meta?.cause || e?.message || 'Failed to update employee';
    res.status(500).json({ message: msg });
  }
});

router.patch('/:id/role', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.params.id as string;
    const role = String(req.body?.role || '').trim();
    const allowedRoles = ['EMPLOYEE', 'HR_MANAGER', 'ADMIN'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Allowed: EMPLOYEE, HR_MANAGER, ADMIN' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee || !employee.user) {
      return res.status(404).json({ message: 'Employee/user not found' });
    }

    if (req.user?.id === employee.user.id && role === 'EMPLOYEE') {
      return res.status(400).json({ message: 'You cannot demote your own role to EMPLOYEE' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: employee.user.id },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    res.json({ message: 'Role updated successfully', user: updatedUser, employeeId: employee.id });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to update role' });
  }
});

router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Employee deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

export default router;
