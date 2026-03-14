import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FileText,
  ShieldCheck,
  HeartPulse,
  Scale,
  Smartphone,
  Copyright,
  CalendarDays,
  DollarSign,
  Baby,
  Clock3,
  HandCoins,
  TriangleAlert,
  House,
  UserRoundCheck,
  Eye,
  Ban,
  Megaphone,
  KeyRound,
  X,
  Plus,
} from 'lucide-react';
import { loadSavedPolicies, saveSavedPolicies } from '../lib/policies';
import type { GeneratedPolicy } from '../lib/policies';

type PolicySection = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type PolicyCard = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  sections: PolicySection[];
};

const buildPolicyContent = (policyTitle: string, sections: string[]) => {
  const sectionBlocks = sections.map((section, index) => {
    const order = index + 1;
    return `${order}. ${section}\n- Purpose: Define enterprise standards and responsibilities for ${section.toLowerCase()}.\n- Scope: Applicable to all employees, contract staff, and relevant stakeholders.\n- Process: Follow approved workflow, documentation, and escalation matrix.\n- Governance: HR and leadership teams review compliance periodically.`;
  }).join('\n\n');

  return `${policyTitle}\n\nDocument Version: 1.0\nEffective Date: [Enter effective date]\nOwner: HR Department\nApproval Authority: [Enter approver]\n\nPolicy Statement\nThis policy establishes the organization standards, responsibilities, and compliance expectations for all covered teams and employees.\n\nPolicy Sections\n${sectionBlocks}\n\nCompliance and Exceptions\nAny policy exception requires written approval from authorized management and HR compliance.\n\nReview Cycle\nThis policy should be reviewed at least once every 12 months or when regulatory/business changes occur.`;
};

const policyCards: PolicyCard[] = [
  {
    id: 'hr-policy-document',
    title: 'HR Policy Document',
    description: 'Comprehensive HR document combining multiple policies.',
    icon: FileText,
    sections: [
      { id: 'leave-policy', label: 'Leave Policy', icon: CalendarDays },
      { id: 'wages-and-payment-policy', label: 'Wages and Payment Policy', icon: DollarSign },
      { id: 'maternity-policy', label: 'Maternity Policy', icon: Baby },
      { id: 'working-hours-policy', label: 'Working Hours Policy', icon: Clock3 },
      { id: 'gratuity-policy', label: 'Gratuity Policy', icon: HandCoins },
      { id: 'grievance-redressal-policy', label: 'Grievance Redressal Policy', icon: TriangleAlert },
      { id: 'remote-work-policy', label: 'Remote Work/Hybrid Policy', icon: House },
    ],
  },
  {
    id: 'posh-policy',
    title: 'POSH Policy',
    description: 'Prevention of Sexual Harassment policy as per Indian law requirements.',
    icon: ShieldCheck,
    sections: [
      { id: 'scope-and-applicability', label: 'Scope and Applicability', icon: FileText },
      { id: 'complaint-procedure', label: 'Complaint Procedure', icon: TriangleAlert },
      { id: 'internal-committee', label: 'Internal Committee Details', icon: UserRoundCheck },
      { id: 'investigation-process', label: 'Investigation Process', icon: Eye },
      { id: 'disciplinary-actions', label: 'Disciplinary Actions', icon: Ban },
    ],
  },
  {
    id: 'health-and-safety-policy',
    title: 'Health and Safety Policy',
    description: 'Workplace safety protocols and health guidelines.',
    icon: HeartPulse,
    sections: [
      { id: 'workplace-safety-rules', label: 'Workplace Safety Rules', icon: ShieldCheck },
      { id: 'emergency-response', label: 'Emergency Response Plan', icon: TriangleAlert },
      { id: 'accident-reporting', label: 'Accident Reporting Process', icon: FileText },
      { id: 'employee-wellness', label: 'Employee Wellness Guidelines', icon: HeartPulse },
    ],
  },
  {
    id: 'anti-bribery-policy',
    title: 'Anti-Bribery/Anti-Corruption Policy',
    description: 'Anti-corruption and ethical business conduct policy.',
    icon: Scale,
    sections: [
      { id: 'gift-hospitality-rules', label: 'Gift and Hospitality Rules', icon: HandCoins },
      { id: 'conflict-of-interest', label: 'Conflict of Interest', icon: Scale },
      { id: 'third-party-conduct', label: 'Third-party Conduct', icon: UserRoundCheck },
      { id: 'reporting-mechanism', label: 'Reporting Mechanism', icon: Megaphone },
    ],
  },
  {
    id: 'social-media-policy',
    title: 'Social Media Policy',
    description: 'Guidelines for employee social media usage and conduct.',
    icon: Smartphone,
    sections: [
      { id: 'acceptable-usage', label: 'Acceptable Usage', icon: Smartphone },
      { id: 'brand-representation', label: 'Brand Representation', icon: Megaphone },
      { id: 'confidentiality-online', label: 'Confidentiality Online', icon: KeyRound },
      { id: 'violation-consequences', label: 'Violation Consequences', icon: Ban },
    ],
  },
  {
    id: 'intellectual-property-policy',
    title: 'Intellectual Property Policy',
    description: 'Intellectual property protection and confidentiality agreements.',
    icon: Copyright,
    sections: [
      { id: 'ownership-of-work', label: 'Ownership of Work', icon: Copyright },
      { id: 'confidential-information', label: 'Confidential Information', icon: KeyRound },
      { id: 'ip-usage-rights', label: 'IP Usage Rights', icon: FileText },
      { id: 'post-employment-obligations', label: 'Post-employment Obligations', icon: UserRoundCheck },
    ],
  },
];

export const PolicyGenerator: React.FC = () => {
  const [activePolicy, setActivePolicy] = useState<PolicyCard | null>(null);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [customSectionName, setCustomSectionName] = useState('');
  const [customSectionsByPolicy, setCustomSectionsByPolicy] = useState<Record<string, PolicySection[]>>({});
  const [savedPolicies, setSavedPolicies] = useState<GeneratedPolicy[]>(() => loadSavedPolicies());

  const modalSections = useMemo(() => {
    if (!activePolicy) return [];
    const custom = customSectionsByPolicy[activePolicy.id] ?? [];
    return [...activePolicy.sections, ...custom];
  }, [activePolicy, customSectionsByPolicy]);

  useEffect(() => {
    if (!activePolicy) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePolicy(null);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [activePolicy]);

  useEffect(() => {
    saveSavedPolicies(savedPolicies);
  }, [savedPolicies]);

  const openBuilder = (policy: PolicyCard) => {
    setActivePolicy(policy);
    setSelectedSectionIds([]);
    setCustomSectionName('');
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSectionIds((prev) => (
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    ));
  };

  const addCustomSection = () => {
    const value = customSectionName.trim();
    if (!activePolicy) return;
    if (!value) return;

    const current = customSectionsByPolicy[activePolicy.id] ?? [];
    const duplicate = current.some((section) => section.label.toLowerCase() === value.toLowerCase())
      || activePolicy.sections.some((section) => section.label.toLowerCase() === value.toLowerCase());

    if (duplicate) {
      toast.error('This section already exists.');
      return;
    }

    const customId = `custom-${activePolicy.id}-${Date.now()}`;
    const newSection: PolicySection = { id: customId, label: value, icon: Plus };
    setCustomSectionsByPolicy((prev) => ({
      ...prev,
      [activePolicy.id]: [...(prev[activePolicy.id] ?? []), newSection],
    }));
    setSelectedSectionIds((prev) => [...prev, customId]);
    setCustomSectionName('');
  };

  const handleGeneratePolicy = () => {
    if (!activePolicy) return;
    if (selectedSectionIds.length === 0) {
      toast.error('Select at least one section to generate policy.');
      return;
    }

    const promptedName = window.prompt('Enter policy name', activePolicy.title);
    if (promptedName === null) {
      return;
    }

    const policyName = promptedName.trim();
    if (!policyName) {
      toast.error('Policy name is required.');
      return;
    }

    const selectedLabels = modalSections
      .filter((section) => selectedSectionIds.includes(section.id))
      .map((section) => section.label);

    const generatedPolicy: GeneratedPolicy = {
      id: `${activePolicy.id}-${Date.now()}`,
      policyId: activePolicy.id,
      policyTitle: policyName,
      sections: selectedLabels,
      content: buildPolicyContent(policyName, selectedLabels),
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false,
    };

    setSavedPolicies((prev) => [generatedPolicy, ...prev]);
    toast.success(`${policyName} generated with ${selectedSectionIds.length} section(s).`);
    setActivePolicy(null);
  };

  return (
    <div className="fade-in">
      <div className="mb-7">
        <h1 className="text-3xl font-semibold text-slate-800 leading-tight">Policy Management Center</h1>
        <p className="text-slate-500 text-base mt-2">
          Create and organize all your company policies with our comprehensive system
        </p>
        <div className="mt-7" style={{ borderTop: '1px solid #e5e7eb' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-7">
        {policyCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white rounded-xl p-6 transition-all duration-150"
              style={{ border: '1px solid #d1d5db', boxShadow: '0 2px 8px rgba(15,23,42,0.08)' }}
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: '#dbeafe' }}>
                <Icon size={28} style={{ color: '#2563eb' }} />
              </div>

              <h2 className="text-3xl font-bold text-slate-700 leading-tight mb-4">{card.title}</h2>
              <p className="text-slate-500 text-lg leading-relaxed min-h-[96px]">{card.description}</p>

              <button
                type="button"
                onClick={() => openBuilder(card)}
                className="mt-5 w-full rounded py-2.5 text-lg font-semibold text-white transition-colors"
                style={{ background: '#3568b9' }}
              >
                Create Policy
              </button>
            </div>
          );
        })}
      </div>

      {activePolicy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setActivePolicy(null);
            }
          }}
        >
          <div className="w-full max-w-[640px] rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <div>
                <h3 className="text-3xl font-semibold text-slate-700">Let’s start building your {activePolicy.title}!</h3>
                <p className="text-slate-500 text-base mt-1">You can choose one or multiple sections.</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close policy builder"
              >
                <X size={22} />
              </button>
            </div>

            <div className="px-5 py-4 border-b border-slate-200">
              <div className="flex gap-2">
                <input
                  value={customSectionName}
                  onChange={(event) => setCustomSectionName(event.target.value)}
                  placeholder="Add custom policy section"
                  className="flex-1 h-11 px-3 rounded-lg border border-slate-300 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addCustomSection}
                  className="h-11 px-4 rounded-lg text-white font-medium"
                  style={{ background: '#3568b9' }}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-5 space-y-3">
              {modalSections.map((section) => {
                const SectionIcon = section.icon;
                const isSelected = selectedSectionIds.includes(section.id);
                return (
                  <button
                    type="button"
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left"
                    style={{
                      borderColor: isSelected ? '#3568b9' : '#d1d5db',
                      background: isSelected ? 'rgba(53,104,185,0.06)' : '#fff',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-5 h-5 rounded border-slate-300"
                    />
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#dbeafe' }}>
                      <SectionIcon size={20} className="text-blue-600" />
                    </div>
                    <span className="text-xl text-slate-700 font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="px-5 py-4 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={handleGeneratePolicy}
                className="rounded-lg px-6 py-2.5 text-white font-semibold"
                style={{ background: '#3568b9' }}
              >
                Generate Policy
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
