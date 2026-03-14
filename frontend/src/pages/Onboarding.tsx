import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, Upload, FileText, Eye, Mail, Check, Briefcase, ShieldCheck,
  Clock, CalendarDays, X, ChevronRight, User, Building2, AlertCircle,
  Laptop, Send, RefreshCw, UserCheck, BadgeCheck, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type PipelineStage =
  | 'CANDIDATE'
  | 'OFFER_SENT'
  | 'OFFER_ACCEPTED'
  | 'ONBOARDING_STARTED'
  | 'DOCS_SUBMITTED'
  | 'VERIFIED'
  | 'IT_SETUP'
  | 'ACTIVE';

type OfferStatus = 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'NEGOTIATION';
type ITProvision = 'Pending' | 'Created' | 'Assigned';

type CheckItem = { id: string; label: string; done: boolean };
type TimelineItem = { id: string; date: string; label: string; done: boolean };

type Candidate = {
  id: string;
  employeeRecordId?: string;
  offerLetterReleasedAt?: string;
  name: string;
  email: string;
  role: string;
  department: string;
  manager: string;
  joiningDate: string;
  stage: PipelineStage;
  offerStatus: OfferStatus;
  docsUploaded: number;
  docsRequired: number;
  docsVerified: boolean;
  bgvStatus: 'Pending' | 'In Progress' | 'Cleared';
  it: { email: ITProvision; laptop: ITProvision; slack: ITProvision };
  checklist: CheckItem[];
  timeline: TimelineItem[];
};

type EmployeeTask = {
  id: string;
  label: string;
  description: string;
  done: boolean;
};

type OfferLetterPayload = {
  employeeId: string;
  employeeName: string;
  referenceNo: string;
  releasedAt: string;
  content: string;
};

type SalaryForm = {
  offerDate: string;
  offerValidTill: string;
  candidateSalutation: string;
  candidateAddress: string;
  candidateCity: string;
  candidateState: string;
  candidatePinCode: string;
  jobTitle: string;
  department: string;
  workLocation: string;
  probationMonths: string;
  noticePeriodDays: string;
  basicMonthly: string;
  hraMonthly: string;
  specialAllowanceMonthly: string;
  esiEmployeeMonthly: string;
  professionalTaxMonthly: string;
  esiEmployerMonthly: string;
  authorizedSignatoryName: string;
  authorizedSignatoryDesignation: string;
};

// ─── Pipeline config ─────────────────────────────────────────────────────────

const PIPELINE: { stage: PipelineStage; label: string }[] = [
  { stage: 'CANDIDATE',          label: 'Candidate' },
  { stage: 'OFFER_SENT',         label: 'Offer Sent' },
  { stage: 'OFFER_ACCEPTED',     label: 'Offer Accepted' },
  { stage: 'ONBOARDING_STARTED', label: 'Onboarding Started' },
  { stage: 'DOCS_SUBMITTED',     label: 'Docs Submitted' },
  { stage: 'VERIFIED',           label: 'Verified' },
  { stage: 'IT_SETUP',           label: 'IT Setup' },
  { stage: 'ACTIVE',             label: 'Employee Active' },
];

const stageIndex = (s: PipelineStage) => PIPELINE.findIndex(p => p.stage === s);

const pipelineStyle = (stage: PipelineStage, current: PipelineStage): React.CSSProperties => {
  const idx = stageIndex(stage);
  const cur = stageIndex(current);
  if (idx < cur)   return { background: 'rgba(16,185,129,0.13)', color: '#047857', borderColor: '#6ee7b7' };
  if (idx === cur) return { background: 'rgba(99,102,241,0.12)', color: '#4338ca', borderColor: '#a5b4fc' };
  return               { background: '#f8fafc',                  color: '#94a3b8', borderColor: '#e2e8f0' };
};

const nextStage = (s: PipelineStage): PipelineStage | null => {
  const idx = stageIndex(s);
  return idx < PIPELINE.length - 1 ? PIPELINE[idx + 1].stage : null;
};

const pct = (list: { done: boolean }[]) =>
  list.length ? Math.round((list.filter(t => t.done).length / list.length) * 100) : 0;

const offerBadge: Record<OfferStatus, React.CSSProperties> = {
  PENDING:     { background: 'rgba(148,163,184,0.15)', color: '#64748b' },
  SENT:        { background: 'rgba(99,102,241,0.12)',  color: '#4338ca' },
  ACCEPTED:    { background: 'rgba(16,185,129,0.12)',  color: '#047857' },
  REJECTED:    { background: 'rgba(239,68,68,0.12)',   color: '#b91c1c' },
  NEGOTIATION: { background: 'rgba(245,158,11,0.12)',  color: '#b45309' },
};

const TODAY = format(new Date(), 'yyyy-MM-dd');

const BLANK_CHECKLIST: CheckItem[] = [
  { id: 'offer',       label: 'Offer Letter Accepted',  done: false },
  { id: 'profile',     label: 'Profile Completed',      done: false },
  { id: 'docs',        label: 'Documents Uploaded',     done: false },
  { id: 'bank',        label: 'Bank Details Submitted', done: false },
  { id: 'bgv',         label: 'Background Verification',done: false },
  { id: 'it',          label: 'IT Setup',               done: false },
  { id: 'orientation', label: 'Orientation',            done: false },
];

const DOC_LIST = [
  'Aadhaar Card / Passport',
  'PAN Card',
  'Degree Certificates',
  'Experience Letters',
  'Address Proof',
  'Bank Details',
  'Passport Size Photo',
];

const EMPLOYEE_TASKS: EmployeeTask[] = [
  { id: 'offer',       label: 'Accept Offer Letter',         description: 'Review and accept your offer letter to begin onboarding.',               done: true  },
  { id: 'profile',     label: 'Complete Profile',            description: 'Fill in personal details, address and emergency contact.',               done: true  },
  { id: 'docs',        label: 'Upload Documents',            description: 'Upload Aadhaar/Passport, degree certificates, experience letters.',      done: false },
  { id: 'bank',        label: 'Submit Bank Details',         description: 'Provide bank name, account number, IFSC and PAN for payroll.',          done: false },
  { id: 'tax',         label: 'Tax Declaration',             description: 'Submit Form 12BB or declare your tax-saving investments.',               done: false },
  { id: 'nda',         label: 'Sign NDA & Policy',           description: 'Read and digitally sign the NDA and company policy agreement.',         done: false },
  { id: 'orientation', label: 'Complete Orientation',        description: 'Attend virtual or in-person orientation and team introduction.',        done: false },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const Onboarding: React.FC = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';

  const [tab, setTab]             = useState<'hr' | 'employee'>(isEmployee ? 'employee' : 'hr');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [showJoinerModal, setShowJoinerModal] = useState(false);
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [newForm, setNewForm]       = useState({ name: '', email: '', role: '', department: '', manager: '', joiningDate: '' });
  const [myTasks, setMyTasks]       = useState<EmployeeTask[]>(EMPLOYEE_TASKS);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>(['Aadhaar Card / Passport', 'PAN Card']);
  const [myOfferLetter, setMyOfferLetter] = useState<OfferLetterPayload | null>(null);
  const [loadingOfferLetter, setLoadingOfferLetter] = useState(false);
  const [offerLetterPdfUrl, setOfferLetterPdfUrl] = useState<string | null>(null);

  // Offer letter modal
  const [offerModalCandidate, setOfferModalCandidate] = useState<Candidate | null>(null);
  const [salaryForm, setSalaryForm] = useState<SalaryForm | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [releasingOffer, setReleasingOffer] = useState(false);

  useEffect(() => {
    if (isEmployee && tab !== 'employee') setTab('employee');
    if (!isEmployee && tab !== 'hr') setTab('hr');
  }, [isEmployee, tab]);

  const loadOnboardingCandidates = useCallback(async () => {
    if (isEmployee) return;
    const { data } = await api.get('/onboarding/records');
    const rows = Array.isArray(data) ? data : [];
    const mapped: Candidate[] = rows.map((row: any) => {
      const emp = row.employee || {};
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email || 'New Joiner';
      return {
        id: row.id,
        employeeRecordId: row.employeeId,
        offerLetterReleasedAt: emp.offerLetterReleasedAt || undefined,
        name: fullName,
        email: emp.email || '',
        role: row.roleTitle || emp.position?.title || 'New Joiner',
        department: row.departmentName || emp.department?.name || '—',
        manager: row.managerName || '—',
        joiningDate: emp.joiningDate ? format(new Date(emp.joiningDate), 'yyyy-MM-dd') : TODAY,
        stage: (row.stage || 'CANDIDATE') as PipelineStage,
        offerStatus: (row.offerStatus || 'PENDING') as OfferStatus,
        docsUploaded: Number(row.docsUploaded || 0),
        docsRequired: Number(row.docsRequired || 7),
        docsVerified: !!row.docsVerified,
        bgvStatus: (row.bgvStatus || 'Pending') as Candidate['bgvStatus'],
        it: {
          email: (row.it?.email || 'Pending') as ITProvision,
          laptop: (row.it?.laptop || 'Pending') as ITProvision,
          slack: (row.it?.slack || 'Pending') as ITProvision,
        },
        checklist: Array.isArray(row.checklist) && row.checklist.length ? row.checklist : BLANK_CHECKLIST.map(t => ({ ...t })),
        timeline: Array.isArray(row.timeline) ? row.timeline : [],
      };
    });
    setCandidates(mapped);
    setSelectedId(prev => (mapped.some(c => c.id === prev) ? prev : (mapped[0]?.id || '')));
  }, [isEmployee]);

  const saveOnboardingRecord = useCallback(async (candidate: Candidate) => {
    if (!candidate.employeeRecordId) return;
    await api.put(`/onboarding/records/by-employee/${candidate.employeeRecordId}`, {
      stage: candidate.stage,
      offerStatus: candidate.offerStatus,
      docsUploaded: candidate.docsUploaded,
      docsRequired: candidate.docsRequired,
      docsVerified: candidate.docsVerified,
      bgvStatus: candidate.bgvStatus,
      it: candidate.it,
      roleTitle: candidate.role,
      departmentName: candidate.department,
      managerName: candidate.manager,
      checklist: candidate.checklist,
      timeline: candidate.timeline,
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (isEmployee) return;
      try {
        await loadOnboardingCandidates();
      } catch {
        if (!mounted) return;
        setCandidates([]);
        setSelectedId('');
      }
    };
    run();
    return () => { mounted = false; };
  }, [isEmployee, loadOnboardingCandidates]);

  useEffect(() => {
    let mounted = true;
    const fetchMyOfferLetter = async () => {
      if (!isEmployee) return;
      setLoadingOfferLetter(true);
      try {
        const { data } = await api.get('/employees/me/offer-letter');
        if (mounted) setMyOfferLetter(data);
      } catch {
        if (mounted) setMyOfferLetter(null);
      } finally {
        if (mounted) setLoadingOfferLetter(false);
      }
    };
    fetchMyOfferLetter();
    return () => { mounted = false; };
  }, [isEmployee]);

  useEffect(() => {
    let mounted = true;
    let localUrl: string | null = null;

    const fetchOfferLetterPdf = async () => {
      if (!isEmployee) return;
      try {
        const { data } = await api.get('/employees/me/offer-letter.pdf', { responseType: 'blob' });
        localUrl = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
        if (mounted) setOfferLetterPdfUrl(localUrl);
      } catch {
        if (mounted) setOfferLetterPdfUrl(null);
      }
    };

    fetchOfferLetterPdf();
    return () => {
      mounted = false;
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [isEmployee, myOfferLetter?.referenceNo]);

  const selected = candidates.find(c => c.id === selectedId) ?? candidates[0] ?? null;

  const hrStats = useMemo(() => ({
    total:        candidates.length,
    active:       candidates.filter(c => c.stage === 'ACTIVE').length,
    inProgress:   candidates.filter(c => c.stage !== 'ACTIVE' && c.stage !== 'CANDIDATE').length,
    pendingOffer: candidates.filter(c => c.offerStatus === 'SENT').length,
    pendingDocs:  candidates.filter(c => c.docsUploaded < c.docsRequired && c.stage !== 'CANDIDATE').length,
    pendingIT:    candidates.filter(c => c.it.email === 'Pending' || c.it.laptop === 'Pending').length,
  }), [candidates]);

  const advanceStage = async (id: string) => {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) return;
    const ns = nextStage(candidate.stage);
    if (!ns) return;

    const updated: Candidate = {
      ...candidate,
      stage: ns,
      offerStatus: ns === 'OFFER_ACCEPTED' ? 'ACCEPTED' : candidate.offerStatus,
    };

    try {
      if (ns === 'ACTIVE' && candidate.employeeRecordId) {
        await api.put(`/employees/${candidate.employeeRecordId}`, { status: 'ACTIVE' });
        await saveOnboardingRecord(updated);
        setCandidates(prev => {
          const remaining = prev.filter(c => c.id !== id);
          setSelectedId(remaining[0]?.id || '');
          return remaining;
        });
        toast.success('Onboarding completed. Moved to employee list.');
        return;
      }

      await saveOnboardingRecord(updated);
      setCandidates(prev => prev.map(c => (c.id === id ? updated : c)));
      toast.success('Stage advanced');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update onboarding stage');
    }
  };

  const verifyDocs = async (id: string) => {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) return;
    const updated: Candidate = { ...candidate, docsVerified: true, stage: 'VERIFIED' };
    try {
      await saveOnboardingRecord(updated);
      setCandidates(prev => prev.map(c => (c.id === id ? updated : c)));
      toast.success('Documents verified');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to verify documents');
    }
  };

  const splitName = (fullName: string) => {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || 'New';
    const lastName = parts.slice(1).join(' ') || 'Joiner';
    return { firstName, lastName };
  };

  const escapeHtml = (value: string) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const printOfferLetter = (letter: OfferLetterPayload) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      toast.error('Please allow popups to print the offer letter');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Offer Letter - ${escapeHtml(letter.employeeName)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            pre { white-space: pre-wrap; word-break: break-word; line-height: 1.5; font-size: 13px; }
          </style>
        </head>
        <body>
          <pre>${escapeHtml(letter.content)}</pre>
          <script>
            window.onload = function () { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const openOfferLetterPdf = () => {
    if (!offerLetterPdfUrl) {
      toast.error('PDF version is not available yet');
      return;
    }
    window.open(offerLetterPdfUrl, '_blank', 'noopener,noreferrer');
  };

  // ── Salary auto-calc ──────────────────────────────────────────────────────
  const computedSalary = useMemo(() => {
    if (!salaryForm) return null;
    const basic = parseFloat(salaryForm.basicMonthly) || 0;
    const hra = parseFloat(salaryForm.hraMonthly) || 0;
    const special = parseFloat(salaryForm.specialAllowanceMonthly) || 0;
    const gross = basic + hra + special;
    const epfEmployee = Math.min(Math.round(basic * 0.12), 1800);
    const esiEmployee = parseFloat(salaryForm.esiEmployeeMonthly) || 0;
    const pt = parseFloat(salaryForm.professionalTaxMonthly) || 200;
    const totalDeductions = epfEmployee + esiEmployee + pt;
    const netMonthly = gross - totalDeductions;
    const epfEmployer = epfEmployee;
    const esiEmployer = parseFloat(salaryForm.esiEmployerMonthly) || 0;
    const totalEmployer = epfEmployer + esiEmployer;
    const totalCtcMonthly = gross + totalEmployer;
    const totalCtcAnnual = totalCtcMonthly * 12;
    return { basic, hra, special, gross, epfEmployee, esiEmployee, pt, totalDeductions, netMonthly, epfEmployer, esiEmployer, totalEmployer, totalCtcMonthly, totalCtcAnnual };
  }, [salaryForm]);

  const fmtINR = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const openOfferModal = (candidate: Candidate) => {
    if (!candidate.employeeRecordId) {
      toast.error('Joiner must have an employee login profile before releasing offer letter');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const validTill = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setSalaryForm({
      offerDate: today,
      offerValidTill: validTill,
      candidateSalutation: 'Mr.',
      candidateAddress: '',
      candidateCity: 'Hyderabad',
      candidateState: 'Telangana',
      candidatePinCode: '',
      jobTitle: candidate.role,
      department: candidate.department,
      workLocation: 'Hyderabad',
      probationMonths: '6',
      noticePeriodDays: '60',
      basicMonthly: '',
      hraMonthly: '',
      specialAllowanceMonthly: '',
      esiEmployeeMonthly: '0',
      professionalTaxMonthly: '200',
      esiEmployerMonthly: '0',
      authorizedSignatoryName: 'Chandrayudu Birru',
      authorizedSignatoryDesignation: 'Director',
    });
    setPreviewPdfUrl(null);
    setOfferModalCandidate(candidate);
  };

  const handleSfChange = (field: keyof SalaryForm, value: string) => {
    setSalaryForm(prev => prev ? { ...prev, [field]: value } : prev);
    // When basic changes, auto-update HRA to 40% of basic if user hasn't set it
    if (field === 'basicMonthly') {
      const basic = parseFloat(value) || 0;
      setSalaryForm(prev => {
        if (!prev) return prev;
        const autoHra = Math.round(basic * 0.4);
        const currHra = parseFloat(prev.hraMonthly) || 0;
        // Only auto-fill if user hasn't explicitly changed HRA
        const gross = basic + (prev.hraMonthly ? currHra : autoHra) + (parseFloat(prev.specialAllowanceMonthly) || 0);
        return { ...prev, basicMonthly: value, hraMonthly: prev.hraMonthly || String(autoHra) };
      });
    }
  };

  const previewOffer = async () => {
    if (!offerModalCandidate?.employeeRecordId || !salaryForm) return;
    if (!computedSalary || computedSalary.gross === 0) {
      toast.error('Please enter at least a Basic salary amount');
      return;
    }
    try {
      setPreviewLoading(true);
      const payload = {
        ...salaryForm,
        grossMonthly: String(computedSalary.gross),
        epfEmployeeMonthly: String(computedSalary.epfEmployee),
        totalDeductionsMonthly: String(computedSalary.totalDeductions),
        netMonthlySalary: String(computedSalary.netMonthly),
        epfEmployerMonthly: String(computedSalary.epfEmployer),
        totalEmployerContributionMonthly: String(computedSalary.totalEmployer),
        totalCtcMonthly: String(computedSalary.totalCtcMonthly),
        totalCtcAnnual: String(computedSalary.totalCtcAnnual),
      };
      const { data } = await api.post(
        `/employees/${offerModalCandidate.employeeRecordId}/offer-letter/preview`,
        payload,
        { responseType: 'blob' }
      );
      if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      setPreviewPdfUrl(url);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const releaseFromModal = async () => {
    if (!offerModalCandidate?.employeeRecordId || !salaryForm || !computedSalary) return;
    if (computedSalary.gross === 0) {
      toast.error('Please enter salary details before releasing');
      return;
    }
    try {
      setReleasingOffer(true);
      const payload = {
        ...salaryForm,
        grossMonthly: String(computedSalary.gross),
        epfEmployeeMonthly: String(computedSalary.epfEmployee),
        totalDeductionsMonthly: String(computedSalary.totalDeductions),
        netMonthlySalary: String(computedSalary.netMonthly),
        epfEmployerMonthly: String(computedSalary.epfEmployer),
        totalEmployerContributionMonthly: String(computedSalary.totalEmployer),
        totalCtcMonthly: String(computedSalary.totalCtcMonthly),
        totalCtcAnnual: String(computedSalary.totalCtcAnnual),
      };
      const { data } = await api.post(
        `/employees/${offerModalCandidate.employeeRecordId}/offer-letter/release`,
        payload,
      );
      const cand = offerModalCandidate;
      const updatedCandidate: Candidate = {
        ...cand,
        offerStatus: 'SENT',
        stage: cand.stage === 'CANDIDATE' ? 'OFFER_SENT' : cand.stage,
        offerLetterReleasedAt: data?.releasedAt || new Date().toISOString(),
        timeline: cand.timeline.some(t => t.label === 'Offer Sent')
          ? cand.timeline
          : [...cand.timeline, { id: `t${Date.now()}`, date: TODAY, label: 'Offer Sent', done: true }],
      };
      await saveOnboardingRecord(updatedCandidate);

      setCandidates(prev => prev.map(c => {
        if (c.id !== cand.id) return c;
        return updatedCandidate;
      }));
      toast.success(`Offer letter released for ${cand.name}`);
      setOfferModalCandidate(null);
      setSalaryForm(null);
      if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to release offer letter');
    } finally {
      setReleasingOffer(false);
    }
  };

  const closeOfferModal = () => {
    setOfferModalCandidate(null);
    setSalaryForm(null);
    if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
    setPreviewPdfUrl(null);
  };

  const releaseOfferLetter = (candidate: Candidate) => openOfferModal(candidate);

  const handleSaveJoiner = async () => {
    if (!newForm.name || !newForm.email || !newForm.role) {
      toast.error('Name, email and role are required');
      return;
    }

    if (editingCandidateId) {
      const currentCandidate = candidates.find(c => c.id === editingCandidateId);
      if (!currentCandidate) return;

      try {
        if (currentCandidate.employeeRecordId) {
          const { firstName, lastName } = splitName(newForm.name);
          await api.put(`/employees/${currentCandidate.employeeRecordId}`, {
            firstName,
            lastName,
            email: String(newForm.email).trim().toLowerCase(),
            joiningDate: newForm.joiningDate || currentCandidate.joiningDate,
          });
        }
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Failed to update employee login profile');
        return;
      }

      const updated = candidates.find(c => c.id === editingCandidateId);
      if (updated) {
        const updatedCandidate: Candidate = {
          ...updated,
          name: newForm.name,
          email: newForm.email,
          role: newForm.role,
          department: newForm.department,
          manager: newForm.manager,
          joiningDate: newForm.joiningDate || updated.joiningDate,
        };
        await saveOnboardingRecord(updatedCandidate);
        setCandidates(prev => prev.map(candidate => candidate.id !== editingCandidateId ? candidate : updatedCandidate));
      }
      toast.success('Joiner details updated');
      setEditingCandidateId(null);
      setShowJoinerModal(false);
      setNewForm({ name: '', email: '', role: '', department: '', manager: '', joiningDate: '' });
      return;
    }

    let createdEmployeeId: string | undefined;
    let loginPassword = 'Welcome@123';
    try {
      const { firstName, lastName } = splitName(newForm.name);
      const { data } = await api.post('/employees', {
        firstName,
        lastName,
        email: String(newForm.email).trim().toLowerCase(),
        joiningDate: newForm.joiningDate || TODAY,
        status: 'INACTIVE',
        employmentType: 'FULL_TIME',
      });
      createdEmployeeId = data?.id;
      loginPassword = data?._defaultPassword || loginPassword;

      const emailDelivery = data?._emailDelivery;
      if (emailDelivery?.sent) {
        toast.success(`${newForm.name} added. Credentials were emailed successfully.`);
      } else {
        toast.success(`${newForm.name} added. Login password: ${loginPassword}. Access is restricted to New Joiner View until onboarding is completed.`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create login account for joiner');
      return;
    }

    if (createdEmployeeId) {
      try {
        const created = await api.post('/onboarding/records', {
          employeeId: createdEmployeeId,
          roleTitle: newForm.role,
          departmentName: newForm.department,
          managerName: newForm.manager,
        });
        if (created?.data?.id) setSelectedId(created.data.id);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Failed to create onboarding record');
      }
    }
    await loadOnboardingCandidates();
    setNewForm({ name: '', email: '', role: '', department: '', manager: '', joiningDate: '' });
    setShowJoinerModal(false);
  };

  const openEditJoiner = (candidate: Candidate) => {
    setEditingCandidateId(candidate.id);
    setSelectedId(candidate.id);
    setNewForm({
      name: candidate.name,
      email: candidate.email,
      role: candidate.role,
      department: candidate.department,
      manager: candidate.manager,
      joiningDate: candidate.joiningDate,
    });
    setShowJoinerModal(true);
  };

  const closeJoinerModal = () => {
    setEditingCandidateId(null);
    setShowJoinerModal(false);
    setNewForm({ name: '', email: '', role: '', department: '', manager: '', joiningDate: '' });
  };

  const removeJoiner = async (candidate: Candidate) => {
    const confirmed = window.confirm(`Remove ${candidate.name} from onboarding?`);
    if (!confirmed) return;

    if (candidate.employeeRecordId) {
      try {
        await api.delete(`/employees/${candidate.employeeRecordId}`);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Failed to remove joiner');
        return;
      }
    }

    await loadOnboardingCandidates();

    if (editingCandidateId === candidate.id) {
      closeJoinerModal();
    }

    toast.success(`${candidate.name} removed`);
  };

  const toggleMyTask   = (id: string) => setMyTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const toggleDoc      = (doc: string) => {
    setUploadedDocs(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]);
    toast.success('Document status updated');
  };

  const myPct = pct(myTasks);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 fade-in">

      {/* ══════════════════════════════════════════════════════════════════
          OFFER LETTER MODAL — salary config + preview before release
      ══════════════════════════════════════════════════════════════════ */}
      {offerModalCandidate && salaryForm && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center"
          style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="relative flex flex-col bg-white w-full max-w-7xl m-4 rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.35)', maxHeight: 'calc(100vh - 32px)' }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
              <div>
                <h2 className="text-base font-bold">Release Offer Letter</h2>
                <p className="text-xs text-white/70 mt-0.5">{offerModalCandidate.name} — {offerModalCandidate.role}</p>
              </div>
              <button type="button" onClick={closeOfferModal}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                <X size={18} />
              </button>
            </div>

            {/* Modal body — two columns */}
            <div className="flex flex-1 overflow-hidden min-h-0">

              {/* LEFT — form */}
              <div className="w-[420px] flex-shrink-0 overflow-y-auto px-5 py-4 space-y-4"
                style={{ borderRight: '1px solid #e2e8f0' }}>

                {/* Offer Details */}
                <section>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Offer Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Offer Date</label>
                      <input type="date" value={salaryForm.offerDate}
                        onChange={e => handleSfChange('offerDate', e.target.value)}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                        style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Valid Till</label>
                      <input type="date" value={salaryForm.offerValidTill}
                        onChange={e => handleSfChange('offerValidTill', e.target.value)}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                        style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Salutation</label>
                      <select value={salaryForm.candidateSalutation}
                        onChange={e => handleSfChange('candidateSalutation', e.target.value)}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                        style={{ border: '1px solid #e2e8f0', background: '#fafafa' }}>
                        <option>Mr.</option><option>Ms.</option><option>Dr.</option><option>Prof.</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Work Location</label>
                      <input type="text" value={salaryForm.workLocation}
                        onChange={e => handleSfChange('workLocation', e.target.value)}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                        style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-slate-500">Address Line</label>
                    <input type="text" value={salaryForm.candidateAddress} placeholder="e.g. Flat 301, XYZ Apartments"
                      onChange={e => handleSfChange('candidateAddress', e.target.value)}
                      className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                      style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500">City</label>
                      <input type="text" value={salaryForm.candidateCity}
                        onChange={e => handleSfChange('candidateCity', e.target.value)}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                        style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">State</label>
                      <input type="text" value={salaryForm.candidateState}
                        onChange={e => handleSfChange('candidateState', e.target.value)}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                        style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">PIN Code</label>
                      <input type="text" value={salaryForm.candidatePinCode} placeholder="500081"
                        onChange={e => handleSfChange('candidatePinCode', e.target.value)}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                        style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Probation (months)</label>
                      <input type="number" value={salaryForm.probationMonths}
                        onChange={e => handleSfChange('probationMonths', e.target.value)}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                        style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Notice Period (days)</label>
                      <input type="number" value={salaryForm.noticePeriodDays}
                        onChange={e => handleSfChange('noticePeriodDays', e.target.value)}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                        style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                    </div>
                  </div>
                </section>

                {/* Salary Structure */}
                <section>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Salary Structure (Monthly — INR)</p>

                  <div className="space-y-2">
                    {/* Inputs */}
                    {([
                      { key: 'basicMonthly', label: 'Basic Salary' },
                      { key: 'hraMonthly', label: 'House Rent Allowance (HRA)' },
                      { key: 'specialAllowanceMonthly', label: 'Special Allowance' },
                    ] as { key: keyof SalaryForm; label: string }[]).map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <label className="text-xs text-slate-600 w-40 flex-shrink-0">{label}</label>
                        <input type="number" value={salaryForm[key]}
                          onChange={e => handleSfChange(key, e.target.value)}
                          placeholder="0"
                          className="w-28 rounded-xl px-3 py-1.5 text-sm text-right text-slate-700 outline-none"
                          style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                      </div>
                    ))}

                    {computedSalary && (
                      <>
                        {/* Gross */}
                        <div className="flex items-center justify-between gap-2 pt-1"
                          style={{ borderTop: '1px solid #e2e8f0' }}>
                          <span className="text-xs font-bold text-slate-700 w-40">Gross Monthly</span>
                          <span className="w-28 text-right text-sm font-bold text-slate-800">
                            ₹ {fmtINR(computedSalary.gross)}
                          </span>
                        </div>

                        {/* Deductions */}
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-1">Deductions</p>
                        {[
                          { label: 'EPF Employee (12% of Basic)', value: computedSalary.epfEmployee, readonly: true },
                          { label: 'ESI Employee', value: null, inputKey: 'esiEmployeeMonthly' as keyof SalaryForm },
                          { label: 'Professional Tax', value: null, inputKey: 'professionalTaxMonthly' as keyof SalaryForm },
                          { label: 'Total Deductions', value: computedSalary.totalDeductions, readonly: true, bold: true },
                          { label: 'Net Monthly (before TDS)', value: computedSalary.netMonthly, readonly: true, bold: true },
                        ].map(row => (
                          <div key={row.label} className="flex items-center justify-between gap-2">
                            <span className={`text-xs ${row.bold ? 'font-bold text-slate-700' : 'text-slate-600'} w-40 flex-shrink-0`}>{row.label}</span>
                            {row.readonly ? (
                              <span className={`w-28 text-right text-sm ${row.bold ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                ₹ {fmtINR(row.value!)}
                              </span>
                            ) : (
                              <input type="number" value={salaryForm[row.inputKey!] as string}
                                onChange={e => handleSfChange(row.inputKey!, e.target.value)}
                                className="w-28 rounded-xl px-3 py-1.5 text-sm text-right text-slate-700 outline-none"
                                style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                            )}
                          </div>
                        ))}

                        {/* Employer */}
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-1">Employer Contribution</p>
                        {[
                          { label: 'EPF Employer (12% of Basic)', value: computedSalary.epfEmployer, readonly: true },
                          { label: 'ESI Employer', value: null, inputKey: 'esiEmployerMonthly' as keyof SalaryForm },
                          { label: 'Total Employer Contribution', value: computedSalary.totalEmployer, readonly: true, bold: true },
                        ].map(row => (
                          <div key={row.label} className="flex items-center justify-between gap-2">
                            <span className={`text-xs ${row.bold ? 'font-bold text-slate-700' : 'text-slate-600'} w-40 flex-shrink-0`}>{row.label}</span>
                            {row.readonly ? (
                              <span className={`w-28 text-right text-sm ${row.bold ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                ₹ {fmtINR(row.value!)}
                              </span>
                            ) : (
                              <input type="number" value={salaryForm[row.inputKey!] as string}
                                onChange={e => handleSfChange(row.inputKey!, e.target.value)}
                                className="w-28 rounded-xl px-3 py-1.5 text-sm text-right text-slate-700 outline-none"
                                style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                            )}
                          </div>
                        ))}

                        {/* CTC Summary */}
                        <div className="rounded-xl px-3 py-2.5 mt-1 space-y-1"
                          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid #c7d2fe' }}>
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-700">Total CTC / Month</span>
                            <span className="font-bold text-indigo-700">₹ {fmtINR(computedSalary.totalCtcMonthly)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-700">Total CTC / Annum</span>
                            <span className="font-bold text-indigo-700">₹ {fmtINR(computedSalary.totalCtcAnnual)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* Signatory */}
                <section>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Authorized Signatory</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Signatory Name</label>
                      <input type="text" value={salaryForm.authorizedSignatoryName}
                        onChange={e => handleSfChange('authorizedSignatoryName', e.target.value)}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                        style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Designation</label>
                      <input type="text" value={salaryForm.authorizedSignatoryDesignation}
                        onChange={e => handleSfChange('authorizedSignatoryDesignation', e.target.value)}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                        style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                    </div>
                  </div>
                </section>

              </div>

              {/* RIGHT — preview panel */}
              <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
                <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                  style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                  <p className="text-sm font-semibold text-slate-700">PDF Preview</p>
                  <button type="button" onClick={previewOffer} disabled={previewLoading}
                    className="text-xs font-semibold px-4 py-2 rounded-xl text-white disabled:opacity-60 flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    <RefreshCw size={12} className={previewLoading ? 'animate-spin' : ''} />
                    {previewLoading ? 'Generating…' : 'Generate Preview'}
                  </button>
                </div>

                <div className="flex-1 min-h-0">
                  {!previewPdfUrl && !previewLoading && (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                      <FileText size={48} className="text-slate-200" />
                      <p className="text-sm">Fill in the salary details and click <strong>Generate Preview</strong></p>
                    </div>
                  )}
                  {previewLoading && (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      <div className="text-center space-y-2">
                        <RefreshCw size={32} className="animate-spin mx-auto text-indigo-400" />
                        <p className="text-sm">Generating PDF…</p>
                      </div>
                    </div>
                  )}
                  {previewPdfUrl && !previewLoading && (
                    <iframe title="Offer Letter Preview" src={previewPdfUrl}
                      className="w-full h-full" style={{ border: 'none' }} />
                  )}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 flex-shrink-0"
              style={{ borderTop: '1px solid #e2e8f0', background: '#fff' }}>
              <button type="button" onClick={closeOfferModal}
                className="text-sm px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button type="button" onClick={previewOffer} disabled={previewLoading}
                  className="text-sm font-semibold px-5 py-2.5 rounded-xl border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 flex items-center gap-2">
                  <Eye size={14} />Preview Offer Letter
                </button>
                <button type="button" onClick={releaseFromModal} disabled={releasingOffer}
                  className="text-sm font-semibold px-6 py-2.5 rounded-xl text-white disabled:opacity-60 flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  <Send size={14} />
                  {releasingOffer ? 'Releasing…' : 'Release Offer Letter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Onboarding</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {tab === 'hr'
              ? 'Manage candidates, offers, documents, IT provisioning and the full onboarding pipeline.'
              : 'Complete your onboarding tasks, upload documents and track your progress.'}
          </p>
        </div>
        {tab === 'hr' && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingCandidateId(null);
                setNewForm({ name: '', email: '', role: '', department: '', manager: '', joiningDate: '' });
                setShowJoinerModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Plus size={14} /> Add New Joiner
            </button>
            <button type="button" onClick={() => toast.success('Offer template opened')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-indigo-600 bg-white"
              style={{ border: '1px solid #cbd5e1' }}>
              <FileText size={14} /> Generate Offer
            </button>
            <button type="button" onClick={() => toast.success('Upload triggered')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-indigo-600 bg-white"
              style={{ border: '1px solid #cbd5e1' }}>
              <Upload size={14} /> Upload Docs
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#f1f5f9' }}>
        {(isEmployee
          ? [{ key: 'employee', label: '👤  New Joiner View' }]
          : [{ key: 'hr', label: '🏢  HR / Admin View' }]
        ).map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key as 'hr' | 'employee')}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === t.key
              ? { background: '#fff', color: '#4338ca', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
              : { color: '#64748b' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          HR TAB
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'hr' && (
        <div className="space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: 'Total Joiners',   value: hrStats.total        },
              { label: 'In Progress',     value: hrStats.inProgress   },
              { label: 'Active',          value: hrStats.active       },
              { label: 'Pending Offers',  value: hrStats.pendingOffer },
              { label: 'Pending Docs',    value: hrStats.pendingDocs  },
              { label: 'Pending IT',      value: hrStats.pendingIT    },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Pipeline Banner */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
            <p className="text-sm font-semibold text-slate-700 mb-3">Onboarding Pipeline</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {PIPELINE.map((p, i) => (
                <React.Fragment key={p.stage}>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                    style={pipelineStyle(p.stage, selected?.stage ?? 'CANDIDATE')}>
                    {p.label}
                    <span className="ml-1 font-bold opacity-70">
                      ({candidates.filter(c => c.stage === p.stage).length})
                    </span>
                  </span>
                  {i < PIPELINE.length - 1 && <ArrowRight size={12} className="text-slate-300 flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* New Joiners Table */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
              <h2 className="text-base font-semibold text-slate-800">All New Joiners</h2>
              <span className="text-xs text-slate-400">{candidates.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {['Name / Email', 'Role / Dept', 'Joining Date', 'Pipeline Stage', 'Offer', 'Progress', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => {
                    const progress = pct(c.checklist);
                    const isSelected = c.id === selectedId;
                    return (
                      <tr key={c.id} onClick={() => setSelectedId(c.id)} className="cursor-pointer"
                        style={{ borderBottom: '1px solid #f8fafc', background: isSelected ? 'rgba(99,102,241,0.04)' : 'transparent' }}>
                        <td className="px-5 py-3">
                          <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm text-slate-700">{c.role}</p>
                          <p className="text-xs text-slate-400">{c.department}</p>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600">
                          {format(new Date(c.joiningDate), 'dd MMM yyyy')}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full border"
                            style={pipelineStyle(c.stage, c.stage)}>
                            {PIPELINE.find(p => p.stage === c.stage)?.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={offerBadge[c.offerStatus]}>
                            {c.offerStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="w-[120px]">
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full"
                                style={{ width: `${progress}%`, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }} />
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{progress}%</p>
                          </div>
                        </td>
                        <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={() => setSelectedId(c.id)}
                              className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
                              <Eye size={11} className="inline mr-0.5" />Detail
                            </button>
                            <button type="button" onClick={() => openEditJoiner(c)}
                              className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
                              Edit
                            </button>
                            <button type="button" onClick={() => releaseOfferLetter(c)}
                              className="text-xs px-2 py-1 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                              <FileText size={11} className="inline mr-0.5" />Release Offer
                            </button>
                            {nextStage(c.stage) && (
                              <button type="button" onClick={() => advanceStage(c.id)}
                                className="text-xs px-2 py-1 rounded border text-indigo-600 hover:bg-indigo-50"
                                style={{ borderColor: '#a5b4fc' }}>
                                <ChevronRight size={11} className="inline mr-0.5" />Advance
                              </button>
                            )}
                            <button type="button" onClick={() => removeJoiner(c)}
                              className="text-xs px-2 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50">
                              Remove
                            </button>
                            <button type="button" onClick={() => toast.success(`Reminder sent to ${c.name}`)}
                              className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
                              <Send size={11} className="inline mr-0.5" />Remind
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Detail panels for selected candidate ─────────────────────── */}
          {selected && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* LEFT: checklist + timeline */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-800">{selected.name}</h3>
                    <span className="text-xs text-slate-400">{pct(selected.checklist)}% done</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mb-3">
                    <div className="h-full rounded-full"
                      style={{ width: `${pct(selected.checklist)}%`, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }} />
                  </div>
                  <div className="space-y-1.5">
                    {selected.checklist.map(task => (
                      <div key={task.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                        style={{ background: task.done ? 'rgba(16,185,129,0.07)' : '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: task.done ? '#d1fae5' : '#f1f5f9' }}>
                          {task.done
                            ? <Check size={10} className="text-emerald-600" />
                            : <Clock size={10} className="text-slate-400" />}
                        </span>
                        <span className="text-xs text-slate-700">{task.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Timeline</h3>
                  <div className="space-y-3">
                    {selected.timeline.map(ev => (
                      <div key={ev.id} className="flex items-start gap-2.5">
                        <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: ev.done ? 'rgba(16,185,129,0.14)' : '#f1f5f9' }}>
                          {ev.done
                            ? <Check size={10} className="text-emerald-600" />
                            : <Clock size={10} className="text-slate-400" />}
                        </span>
                        <div>
                          <p className="text-xs text-slate-400">{format(new Date(ev.date), 'dd MMM yyyy')}</p>
                          <p className="text-xs font-medium text-slate-700">{ev.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MIDDLE: docs + BGV */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-800">Document Verification</h3>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={
                        selected.docsVerified
                          ? { background: 'rgba(16,185,129,0.12)', color: '#047857' }
                          : selected.docsUploaded < selected.docsRequired
                            ? { background: 'rgba(245,158,11,0.12)', color: '#b45309' }
                            : { background: 'rgba(99,102,241,0.12)', color: '#4338ca' }
                      }>
                      {selected.docsVerified ? 'Verified' : selected.docsUploaded < selected.docsRequired ? 'Pending Upload' : 'Ready to Verify'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {DOC_LIST.map((doc, i) => {
                      const uploaded = i < selected.docsUploaded;
                      return (
                        <div key={doc} className="flex items-center justify-between px-3 py-2 rounded-xl"
                          style={{ background: uploaded ? 'rgba(16,185,129,0.06)' : '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <span className="text-xs text-slate-700">{doc}</span>
                          {uploaded
                            ? <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><Check size={11} />Uploaded</span>
                            : <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={11} />Pending</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => toast.success('Documents viewed')}
                      className="flex-1 text-xs py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1">
                      <Eye size={12} />View All
                    </button>
                    <button type="button"
                      disabled={selected.docsUploaded < selected.docsRequired || selected.docsVerified}
                      onClick={() => verifyDocs(selected.id)}
                      className="flex-1 text-xs py-2 rounded-xl text-white flex items-center justify-center gap-1 disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                      <BadgeCheck size={12} />Verify Docs
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Background Verification</h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-600">BGV Status</span>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={
                        selected.bgvStatus === 'Cleared'
                          ? { background: 'rgba(16,185,129,0.12)', color: '#047857' }
                          : selected.bgvStatus === 'In Progress'
                            ? { background: 'rgba(99,102,241,0.12)', color: '#4338ca' }
                            : { background: 'rgba(245,158,11,0.12)', color: '#b45309' }
                      }>
                      {selected.bgvStatus}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => toast.success('BGV request sent')}
                      className="flex-1 text-xs py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1">
                      <Send size={12} />Send for BGV
                    </button>
                    <button type="button" onClick={() => toast.success('BGV report downloaded')}
                      className="flex-1 text-xs py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1">
                      <RefreshCw size={12} />Get Report
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT: IT provisioning + Stage actions */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">IT Provisioning</h3>
                  {[
                    { label: 'Email Account', value: selected.it.email,  icon: <Mail   size={14} /> },
                    { label: 'Laptop',        value: selected.it.laptop, icon: <Laptop size={14} /> },
                    { label: 'Slack / Chat',  value: selected.it.slack,  icon: <ShieldCheck size={14} /> },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2.5"
                      style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <div className="flex items-center gap-2 text-slate-600">
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={item.value !== 'Pending'
                            ? { background: 'rgba(16,185,129,0.12)', color: '#047857' }
                            : { background: 'rgba(245,158,11,0.12)', color: '#b45309' }}>
                          {item.value}
                        </span>
                        <button type="button" onClick={() => toast.success(`${item.label} provisioning requested`)}
                          className="text-xs px-2 py-0.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
                          {item.value === 'Pending' ? 'Request' : 'Done'}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => toast.success('Full IT setup requested')}
                    className="mt-3 w-full text-xs py-2 rounded-xl text-white flex items-center justify-center gap-1"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    <Briefcase size={12} />Request Full IT Setup
                  </button>
                </div>

                {/* Stage Actions */}
                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">Stage Actions</h3>
                  <p className="text-xs text-slate-400 mb-3">
                    Current stage: <span className="font-semibold text-indigo-600">
                      {PIPELINE.find(p => p.stage === selected.stage)?.label}
                    </span>
                  </p>
                  <div className="space-y-2">
                    {selected.stage === 'CANDIDATE' && (
                      <button type="button" onClick={() => releaseOfferLetter(selected)}
                        className="w-full text-sm py-2.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        <FileText size={14} />Release Offer Letter
                      </button>
                    )}
                    {selected.stage === 'OFFER_SENT' && (<>
                      <button type="button" onClick={() => advanceStage(selected.id)}
                        className="w-full text-sm py-2.5 rounded-xl font-semibold text-emerald-700 flex items-center justify-center gap-2"
                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #a7f3d0' }}>
                        <Check size={14} />Mark Offer Accepted
                      </button>
                      <button type="button" onClick={() => toast.success('Negotiation noted')}
                        className="w-full text-sm py-2.5 rounded-xl font-semibold text-amber-700 flex items-center justify-center gap-2"
                        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid #fde68a' }}>
                        <RefreshCw size={14} />Update Offer (Negotiation)
                      </button>
                      <button type="button" onClick={() => {
                        setCandidates(prev => prev.map(c =>
                          c.id !== selected.id ? c : { ...c, offerStatus: 'REJECTED', stage: 'CANDIDATE' }
                        ));
                        toast('Offer marked as rejected');
                      }}
                        className="w-full text-sm py-2.5 rounded-xl font-semibold text-red-700 flex items-center justify-center gap-2"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #fecaca' }}>
                        <X size={14} />Offer Rejected — Close Candidate
                      </button>
                    </>)}
                    {selected.stage === 'OFFER_ACCEPTED' && (
                      <button type="button" onClick={() => advanceStage(selected.id)}
                        className="w-full text-sm py-2.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        <UserCheck size={14} />Start Onboarding Workflow
                      </button>
                    )}
                    {(['ONBOARDING_STARTED','DOCS_SUBMITTED','VERIFIED','IT_SETUP'] as PipelineStage[]).includes(selected.stage) && (
                      <button type="button" onClick={() => advanceStage(selected.id)}
                        className="w-full text-sm py-2.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        <ChevronRight size={14} />
                        Advance to {PIPELINE.find(p => p.stage === nextStage(selected.stage))?.label}
                      </button>
                    )}
                    {selected.stage === 'ACTIVE' && (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #a7f3d0' }}>
                        <BadgeCheck size={16} className="text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-700">Employee is Active</span>
                      </div>
                    )}
                    <button type="button" onClick={() => toast.success(`Reminder sent to ${selected.name}`)}
                      className="w-full text-sm py-2 rounded-xl font-medium text-slate-600 flex items-center justify-center gap-2"
                      style={{ border: '1px solid #e2e8f0' }}>
                      <Mail size={14} />Send Reminder Email
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          EMPLOYEE / NEW JOINER TAB
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'employee' && (
        <div className="space-y-6">

          {/* Welcome banner */}
          <div className="rounded-2xl p-6 flex flex-wrap items-center gap-4"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 24px rgba(99,102,241,0.25)' }}>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <User size={24} className="text-white" />
            </div>
            <div className="text-white">
              <p className="font-extrabold text-lg">Welcome, {(user?.employee as any)?.firstName ?? 'New Joiner'}!</p>
              <p className="text-white/80 text-sm">
                Your joining date is <span className="font-semibold text-white">{format(new Date(), 'dd MMMM yyyy')}</span>.
                Complete all tasks below to activate your account.
              </p>
            </div>
            <div className="ml-auto text-right text-white hidden sm:block">
              <p className="text-3xl font-extrabold">{myPct}%</p>
              <p className="text-xs text-white/70">Overall Progress</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-800">Onboarding Progress</h2>
              <span className="text-sm font-bold text-indigo-600">{myPct}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${myPct}%`, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }} />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {myTasks.map(t => (
                <span key={t.id} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={t.done
                    ? { background: 'rgba(16,185,129,0.1)', color: '#047857' }
                    : { background: '#f1f5f9', color: '#64748b' }}>
                  {t.done ? <Check size={11} /> : <Clock size={11} />}{t.label}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-base font-semibold text-slate-800">Your Offer Letter</h2>
              <div className="flex items-center gap-2">
                {offerLetterPdfUrl && (
                  <button
                    type="button"
                    onClick={openOfferLetterPdf}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Open PDF
                  </button>
                )}
                {myOfferLetter && (
                  <button
                    type="button"
                    onClick={() => printOfferLetter(myOfferLetter)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    Print Offer Letter
                  </button>
                )}
              </div>
            </div>

            {loadingOfferLetter && (
              <p className="text-sm text-slate-500">Loading your offer letter...</p>
            )}

            {!loadingOfferLetter && !myOfferLetter && (
              <div className="rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'rgba(245,158,11,0.1)', color: '#b45309', border: '1px solid #fde68a' }}>
                Your offer letter has not been released yet. Please contact HR.
              </div>
            )}

            {!loadingOfferLetter && myOfferLetter && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Ref:</span> {myOfferLetter.referenceNo} &nbsp;•&nbsp;
                  <span className="font-semibold text-slate-700">Released:</span> {format(new Date(myOfferLetter.releasedAt), 'dd MMM yyyy')}
                </div>
                {offerLetterPdfUrl && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0', background: '#fff' }}>
                    <iframe
                      title="Offer Letter PDF"
                      src={offerLetterPdfUrl}
                      className="w-full h-[640px]"
                    />
                  </div>
                )}
                <pre
                  className="text-xs whitespace-pre-wrap rounded-xl p-3 max-h-[360px] overflow-auto"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}
                >
                  {myOfferLetter.content}
                </pre>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Task checklist */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <h2 className="text-base font-semibold text-slate-800 mb-3">Your Onboarding Checklist</h2>
              <div className="space-y-2">
                {myTasks.map(task => (
                  <button key={task.id} type="button" onClick={() => toggleMyTask(task.id)}
                    className="w-full text-left rounded-xl p-3 flex items-start gap-3 hover:shadow-sm transition-all"
                    style={{ border: '1px solid #e2e8f0', background: task.done ? 'rgba(16,185,129,0.06)' : '#fff' }}>
                    <span className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: task.done ? '#10b981' : '#cbd5e1', background: task.done ? '#d1fae5' : '#fff' }}>
                      {task.done && <Check size={11} className="text-emerald-600" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${task.done ? 'text-emerald-700 line-through' : 'text-slate-800'}`}>
                        {task.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                    </div>
                    {!task.done && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(245,158,11,0.12)', color: '#b45309' }}>
                        Pending
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Document upload */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-800">Upload Documents</h2>
                <span className="text-xs font-semibold text-slate-500">{uploadedDocs.length}/{DOC_LIST.length} uploaded</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mb-4">
                <div className="h-full rounded-full"
                  style={{ width: `${Math.round((uploadedDocs.length / DOC_LIST.length) * 100)}%`, background: 'linear-gradient(135deg,#10b981,#059669)' }} />
              </div>
              <div className="space-y-2">
                {DOC_LIST.map(doc => {
                  const uploaded = uploadedDocs.includes(doc);
                  return (
                    <div key={doc} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ border: '1px solid #e2e8f0', background: uploaded ? 'rgba(16,185,129,0.05)' : '#fff' }}>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className={uploaded ? 'text-emerald-500' : 'text-slate-400'} />
                        <span className="text-sm text-slate-700">{doc}</span>
                      </div>
                      <button type="button" onClick={() => toggleDoc(doc)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1"
                        style={uploaded
                          ? { background: 'rgba(16,185,129,0.12)', color: '#047857' }
                          : { background: 'rgba(99,102,241,0.1)', color: '#4338ca' }}>
                        {uploaded ? <><Check size={11} />Uploaded</> : <><Upload size={11} />Upload</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Bank details */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <h2 className="text-base font-semibold text-slate-800 mb-4">Bank Details</h2>
              <div className="space-y-3">
                {(['Bank Name', 'Account Number', 'IFSC Code', 'PAN Number'] as const).map(field => (
                  <div key={field}>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{field}</label>
                    <input type={field === 'Account Number' ? 'number' : 'text'}
                      placeholder={`Enter ${field}`}
                      className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                      style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                  </div>
                ))}
                <button type="button" onClick={() => toast.success('Bank details saved')}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white mt-1"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  Save Bank Details
                </button>
              </div>
            </div>

            {/* Compliance */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <h2 className="text-base font-semibold text-slate-800 mb-4">Compliance &amp; Agreements</h2>
              <div className="space-y-3">
                {[
                  { label: 'Tax Declaration (Form 12BB)',    desc: 'Declare tax-saving investments and HRA.' },
                  { label: 'Non-Disclosure Agreement (NDA)', desc: 'Sign the company NDA before Day 1.' },
                  { label: 'Company Policy Acceptance',      desc: 'Acknowledge the employee handbook and code of conduct.' },
                  { label: 'PF & ESIC Enrollment',           desc: 'Provide UAN and ESIC registration details.' },
                ].map(item => (
                  <div key={item.label} className="flex items-start justify-between gap-3 px-3 py-3 rounded-xl"
                    style={{ border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <button type="button" onClick={() => toast.success(`${item.label} submitted`)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#4338ca' }}>
                      Submit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add New Joiner Modal ─────────────────────────────────────────── */}
      {showJoinerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.55)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" style={{ border: '1px solid #e2e8f0' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="text-base font-semibold text-slate-800">
                {editingCandidateId ? 'Edit Joiner Details' : 'Add New Joiner'}
              </h2>
              <button type="button" onClick={closeJoinerModal} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {([ ['name','Full Name','text'], ['email','Email Address','email'], ['role','Role / Designation','text'],
                  ['department','Department','text'], ['manager','Reporting Manager','text'], ['joiningDate','Joining Date','date'],
              ] as [keyof typeof newForm, string, string][]).map(([field, label, type]) => (
                <div key={field}>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
                  <input type={type} value={newForm[field]}
                    onChange={e => setNewForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={`Enter ${label}`}
                    className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                    style={{ border: '1px solid #e2e8f0', background: '#fafafa' }} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button type="button" onClick={closeJoinerModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600"
                style={{ border: '1px solid #e2e8f0' }}>
                Cancel
              </button>
              <button type="button" onClick={handleSaveJoiner}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {editingCandidateId ? 'Save Changes' : 'Add Joiner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────
// Dummy stub so the old import paths (if any) still compile:
const _unused = { Building2, AlertCircle, CalendarDays, UserCheck };
void _unused;
