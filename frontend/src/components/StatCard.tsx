import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  trend?: { value: number; label: string };
  onClick?: () => void;
}

const colorMap: Record<StatCardProps['color'], { grad: string; soft: string }> = {
  blue:   { grad: 'linear-gradient(135deg,#3b82f6,#06b6d4)', soft: 'rgba(59,130,246,0.12)' },
  green:  { grad: 'linear-gradient(135deg,#10b981,#34d399)', soft: 'rgba(16,185,129,0.12)' },
  purple: { grad: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', soft: 'rgba(139,92,246,0.12)' },
  orange: { grad: 'linear-gradient(135deg,#f59e0b,#fb923c)', soft: 'rgba(245,158,11,0.12)' },
  red:    { grad: 'linear-gradient(135deg,#ef4444,#f87171)', soft: 'rgba(239,68,68,0.12)'  },
  indigo: { grad: 'linear-gradient(135deg,#6366f1,#818cf8)', soft: 'rgba(99,102,241,0.12)' },
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, color, trend, onClick }) => {
  const c = colorMap[color];
  const positive = (trend?.value ?? 0) >= 0;

  return (
    <div
      className={`bg-white rounded-2xl p-5 flex flex-col gap-4 group transition-all duration-200 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={onClick}
      style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: c.grad }}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <span
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
            style={{
              background: positive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: positive ? '#059669' : '#dc2626',
            }}
          >
            {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <div>
        <p className="text-[26px] font-extrabold text-slate-800 leading-none tracking-tight">{value}</p>
        <p className="text-[13px] font-medium text-slate-500 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      {/* Progress accent */}
      <div className="h-1 w-full rounded-full" style={{ background: c.soft }}>
        <div
          className="h-full rounded-full transition-all duration-700 group-hover:w-4/5"
          style={{ background: c.grad, width: '55%' }}
        />
      </div>
    </div>
  );
};
