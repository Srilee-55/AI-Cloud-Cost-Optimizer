import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const KpiCard = ({
  title,
  value,
  change,
  changeType = 'neutral', // 'positive' (good/green), 'negative' (bad/red), 'neutral'
  changeLabel = 'vs last period',
  icon: Icon,
  iconColor = 'text-brand-600 bg-brand-50',
  badge,
  subtitle,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {badge && <div>{badge}</div>}
      </div>

      {(change !== undefined || subtitle) && (
        <div className="mt-3 flex items-center text-xs space-x-1.5">
          {change !== undefined && (
            <span
              className={`inline-flex items-center font-semibold px-1.5 py-0.5 rounded ${
                changeType === 'positive'
                  ? 'bg-emerald-50 text-emerald-700'
                  : changeType === 'negative'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {changeType === 'positive' ? (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              ) : changeType === 'negative' ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <Minus className="w-3.5 h-3.5 mr-0.5" />
              )}
              {Math.abs(change)}%
            </span>
          )}
          <span className="text-slate-500">{subtitle || changeLabel}</span>
        </div>
      )}
    </div>
  );
};

export default KpiCard;
