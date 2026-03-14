import React from 'react';

export const ProbationLetter: React.FC = () => {
  return (
    <div className="space-y-4 fade-in">
      <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Probation Letter</h1>
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p className="text-slate-600">Generate and track probation letter workflows here.</p>
      </div>
    </div>
  );
};
