import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { loadSavedPolicies, saveSavedPolicies } from '../lib/policies';
import type { GeneratedPolicy } from '../lib/policies';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const isAdminRole = (role?: string) => role ? ADMIN_ROLES.includes(role) : false;

export const PolicySavedDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  const [savedPolicies, setSavedPolicies] = useState<GeneratedPolicy[]>([]);
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyContent, setPolicyContent] = useState('');

  const selectedPolicy = useMemo(
    () => savedPolicies.find((item) => item.id === id) ?? null,
    [savedPolicies, id],
  );

  const canAccessPolicy = !!selectedPolicy && (isAdmin || selectedPolicy.isPublished);

  useEffect(() => {
    setSavedPolicies(loadSavedPolicies());
  }, []);

  useEffect(() => {
    if (!selectedPolicy) return;
    setPolicyTitle(selectedPolicy.policyTitle);
    setPolicyContent(selectedPolicy.content);
  }, [selectedPolicy]);

  const handleSave = () => {
    if (!selectedPolicy || !isAdmin) return;
    if (!policyTitle.trim() || !policyContent.trim()) {
      toast.error('Policy name and content are required.');
      return;
    }

    const updatedPolicies = savedPolicies.map((item) => (
      item.id === selectedPolicy.id
        ? {
            ...item,
            policyTitle: policyTitle.trim(),
            content: policyContent.trim(),
            updatedAt: new Date().toISOString(),
          }
        : item
    ));

    setSavedPolicies(updatedPolicies);
    saveSavedPolicies(updatedPolicies);
    toast.success('Policy updated successfully.');
  };

  const togglePublish = () => {
    if (!selectedPolicy || !isAdmin) return;
    const nextPublished = !selectedPolicy.isPublished;
    const now = new Date().toISOString();

    const updatedPolicies = savedPolicies.map((item) => (
      item.id === selectedPolicy.id
        ? {
            ...item,
            isPublished: nextPublished,
            publishedAt: nextPublished ? now : undefined,
            updatedAt: now,
          }
        : item
    ));

    setSavedPolicies(updatedPolicies);
    saveSavedPolicies(updatedPolicies);
    toast.success(nextPublished ? 'Policy published for all employees.' : 'Policy moved back to admin-only.');
  };

  if (!selectedPolicy) {
    return (
      <div className="space-y-4 fade-in">
        <button
          type="button"
          onClick={() => navigate('/policy-generator/saved')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-600"
        >
          <ArrowLeft size={16} />
          Back to Saved Policies
        </button>

        <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #d1d5db' }}>
          <h1 className="text-xl font-semibold text-slate-800">Saved policy not found</h1>
          <p className="text-slate-500 mt-2">This policy may have been deleted.</p>
        </div>
      </div>
    );
  }

  if (!canAccessPolicy) {
    return (
      <div className="space-y-4 fade-in">
        <button
          type="button"
          onClick={() => navigate('/policy-generator/saved')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-600"
        >
          <ArrowLeft size={16} />
          Back to Saved Policies
        </button>

        <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #d1d5db' }}>
          <h1 className="text-xl font-semibold text-slate-800">Admin-only policy</h1>
          <p className="text-slate-500 mt-2">This policy is not published yet and is visible only to admin users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-in">
      <button
        type="button"
        onClick={() => navigate('/policy-generator/saved')}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-600"
      >
        <ArrowLeft size={16} />
        Back to Saved Policies
      </button>

      <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #d1d5db' }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">{selectedPolicy.policyTitle}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Generated {new Date(selectedPolicy.generatedAt).toLocaleString()} · Updated {new Date(selectedPolicy.updatedAt).toLocaleString()}
            </p>
            <p className="text-sm mt-1" style={{ color: selectedPolicy.isPublished ? '#15803d' : '#b91c1c' }}>
              {selectedPolicy.isPublished
                ? `Published${selectedPolicy.publishedAt ? ` on ${new Date(selectedPolicy.publishedAt).toLocaleString()}` : ''}`
                : 'Unpublished (admin-only)'}
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePublish}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium border"
                style={selectedPolicy.isPublished
                  ? { borderColor: '#fca5a5', color: '#b91c1c', background: '#fff' }
                  : { borderColor: '#86efac', color: '#15803d', background: '#fff' }}
              >
                {selectedPolicy.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
                style={{ background: '#3568b9' }}
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {selectedPolicy.sections.map((section) => (
            <span
              key={`${selectedPolicy.id}-${section}`}
              className="px-2.5 py-1 rounded-md text-xs font-medium"
              style={{ background: '#eff6ff', color: '#1d4ed8' }}
            >
              {section}
            </span>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Policy Name</label>
            <input
              value={policyTitle}
              onChange={(event) => setPolicyTitle(event.target.value)}
              readOnly={!isAdmin}
              className="w-full h-11 px-3 rounded-lg border border-slate-300 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Policy Content</label>
            <textarea
              value={policyContent}
              onChange={(event) => setPolicyContent(event.target.value)}
              readOnly={!isAdmin}
              className="w-full min-h-[420px] p-3 rounded-lg border border-slate-300 outline-none focus:border-blue-500 resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
