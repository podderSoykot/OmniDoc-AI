import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  badge?: string;
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'from-indigo-500/10 to-violet-500/10 text-indigo-600',
  badge 
}: StatCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
            {badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-xl bg-gradient-to-br ${color} transition-transform group-hover:scale-110 duration-200`}>
          {icon}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent group-hover:via-indigo-500 transition-all duration-300" />
    </div>
  );
}
