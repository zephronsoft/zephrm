export type GeneratedPolicy = {
  id: string;
  policyId: string;
  policyTitle: string;
  sections: string[];
  content: string;
  generatedAt: string;
  updatedAt: string;
  isPublished: boolean;
  publishedAt?: string;
};

export const SAVED_POLICIES_KEY = 'hrm_saved_policies_v1';

export const loadSavedPolicies = (): GeneratedPolicy[] => {
  try {
    const stored = localStorage.getItem(SAVED_POLICIES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as Partial<GeneratedPolicy>[];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item, index) => {
      const generatedAt = item.generatedAt ?? new Date().toISOString();
      return {
        id: item.id ?? `legacy-${index}-${Date.now()}`,
        policyId: item.policyId ?? 'legacy-policy',
        policyTitle: item.policyTitle ?? 'Policy Document',
        sections: Array.isArray(item.sections) ? item.sections : [],
        content: item.content ?? '',
        generatedAt,
        updatedAt: item.updatedAt ?? generatedAt,
        isPublished: item.isPublished ?? false,
        publishedAt: item.publishedAt,
      };
    });
  } catch {
    return [];
  }
};

export const saveSavedPolicies = (items: GeneratedPolicy[]) => {
  localStorage.setItem(SAVED_POLICIES_KEY, JSON.stringify(items));
};
