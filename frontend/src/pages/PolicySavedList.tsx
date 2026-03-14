import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { loadSavedPolicies, saveSavedPolicies } from '../lib/policies';
import type { GeneratedPolicy } from '../lib/policies';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const isAdminRole = (role?: string) => role ? ADMIN_ROLES.includes(role) : false;

const policyGroups = [
  { id: 'hr-policy-document', title: 'HR Policy Document' },
  { id: 'posh-policy', title: 'POSH Policy' },
  { id: 'health-and-safety-policy', title: 'Health and Safety Policy' },
  { id: 'anti-bribery-policy', title: 'Anti-Bribery/Anti-Corruption Policy' },
  { id: 'social-media-policy', title: 'Social Media Policy' },
  { id: 'intellectual-property-policy', title: 'Intellectual Property Policy' },
];

export const PolicySavedList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);
  const [savedPolicies, setSavedPolicies] = useState<GeneratedPolicy[]>([]);

  useEffect(() => {
    setSavedPolicies(loadSavedPolicies());
  }, []);

  const visiblePolicies = useMemo(
    () => (isAdmin ? savedPolicies : savedPolicies.filter((item) => item.isPublished)),
    [isAdmin, savedPolicies],
  );

  const groupedPolicies = useMemo(
    () => policyGroups.map((group) => ({
      ...group,
      items: visiblePolicies.filter((item) => item.policyId === group.id),
    })),
    [visiblePolicies],
  );

  const deleteSavedPolicy = (id: string) => {
    const next = savedPolicies.filter((item) => item.id !== id);
    setSavedPolicies(next);
    saveSavedPolicies(next);
    toast.success('Saved policy removed.');
  };

  const clearAllSavedPolicies = () => {
    if (savedPolicies.length === 0) return;
    setSavedPolicies([]);
    saveSavedPolicies([]);
    toast.success('All saved policies cleared.');
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Saved Policies</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin
              ? 'Unpublished policies are admin-only. Publish to make visible for all employees.'
              : 'Only published policies are visible to employees.'}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={clearAllSavedPolicies}
            disabled={savedPolicies.length === 0}
            className="px-3 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-40"
            style={{ borderColor: '#cbd5e1', color: '#475569', background: '#fff' }}
          >
            Clear All
          </button>
        )}
      </div>

      {visiblePolicies.length === 0 ? (
        <div className="bg-white rounded-xl p-6" style={{ border: '1px dashed #cbd5e1' }}>
          <p className="text-slate-500">
            {isAdmin
              ? 'No policies generated yet. Create policies from Policy Generator.'
              : 'No published policies available yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedPolicies.map((group) => (
            <div key={group.id} className="bg-white rounded-xl p-4" style={{ border: '1px solid #d1d5db' }}>
              <h2 className="text-lg font-semibold text-slate-800">{group.title}</h2>
              {group.items.length === 0 ? (
                <p className="text-sm text-slate-500 mt-2">No saved policies under this section.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg p-3"
                      style={{ border: '1px solid #e2e8f0' }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.policyTitle}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(item.generatedAt).toLocaleDateString()} · {new Date(item.generatedAt).toLocaleTimeString()}
                        </p>
                        {isAdmin && (
                          <span
                            className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-medium"
                            style={item.isPublished ? { background: '#dcfce7', color: '#15803d' } : { background: '#fee2e2', color: '#b91c1c' }}
                          >
                            {item.isPublished ? 'Published' : 'Unpublished'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/policy-generator/saved/${item.id}`)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          Open Page
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => deleteSavedPolicy(item.id)}
                            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
                            title="Delete saved policy"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
