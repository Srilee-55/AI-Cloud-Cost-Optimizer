import React from 'react';
import { Calendar, Sparkles, TrendingUp, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import Button from '../common/Button';
import Badge from '../common/Badge';

const WeeklyDigestCard = ({ digest, onAction }) => {
  const { formatAmount } = useCurrency();

  if (!digest) return null;

  return (
    <div className="bg-gradient-to-br from-white to-brand-50/30 rounded-2xl border border-brand-200 p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-brand-100">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-brand-600 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Weekly AI Cost Digest</h3>
            <span className="text-xs text-slate-500 flex items-center mt-0.5">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {digest.period_start} – {digest.period_end}
            </span>
          </div>
        </div>

        <Badge variant={digest.total_cost_change_pct > 10 ? 'warning' : 'success'} size="md">
          {digest.total_cost_change_pct > 0 ? `+${digest.total_cost_change_pct}%` : `${digest.total_cost_change_pct}%`} vs last week
        </Badge>
      </div>

      {/* Highlights Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">7-Day Spend</span>
          <div className="text-base font-bold text-slate-900 mt-1">{formatAmount(digest.total_spend)}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">New Anomalies</span>
          <div className="text-base font-bold text-rose-600 mt-1">{digest.new_anomalies_count} Events</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">New AI Plans</span>
          <div className="text-base font-bold text-brand-600 mt-1">{digest.new_recommendations_count} Ready</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Potential Savings</span>
          <div className="text-base font-bold text-emerald-600 mt-1">{formatAmount(digest.potential_savings_amount)}/mo</div>
        </div>
      </div>

      {/* Key Bullets */}
      <div className="space-y-2 mb-4">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Executive Highlights</div>
        <ul className="space-y-1.5">
          {digest.key_highlights?.map((hl, idx) => (
            <li key={idx} className="text-xs text-slate-600 flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mr-2 mt-1.5 flex-shrink-0"></span>
              <span>{hl}</span>
            </li>
          ))}
        </ul>
      </div>

      {onAction && (
        <Button variant="primary" size="sm" icon={ArrowRight} onClick={onAction} className="w-full sm:w-auto">
          Review Optimization Recommendations
        </Button>
      )}
    </div>
  );
};

export default WeeklyDigestCard;
