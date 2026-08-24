import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Play,
  HelpCircle,
  TrendingDown,
  ShieldAlert,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import Button from '../common/Button';
import Badge from '../common/Badge';

const RecommendationCard = ({
  recommendation,
  onApprove,
  onReject,
  onSimulate,
  onExplain,
  isLoading = false,
}) => {
  const { formatAmount } = useCurrency();
  const [expanded, setExpanded] = useState(false);

  const r = recommendation;

  const priorityVariants = {
    Critical: 'critical',
    High: 'danger',
    Medium: 'warning',
    Low: 'info',
  };

  const statusVariants = {
    pending: { label: 'Pending Approval', variant: 'warning' },
    approved: { label: 'Approved — Ready to Simulate', variant: 'primary' },
    simulated: { label: 'Simulated Successfully', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'default' },
  };

  const statusInfo = statusVariants[r.approval_status] || statusVariants.pending;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card hover:shadow-md transition-all overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant={priorityVariants[r.priority] || 'warning'} size="sm" dot>
                {r.priority} Priority
              </Badge>
              <Badge variant="default" size="sm">
                {r.provider?.toUpperCase()} • {r.service}
              </Badge>
              <Badge variant={statusInfo.variant} size="sm">
                {statusInfo.label}
              </Badge>
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">{r.title}</h3>
          </div>
        </div>

        {/* Savings Metric Capsule */}
        <div className="sm:text-right bg-emerald-50/70 border border-emerald-200 rounded-xl px-4 py-2 flex-shrink-0">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Estimated Savings</span>
          <div className="text-lg font-extrabold text-emerald-700">
            {formatAmount(r.estimated_savings)}
            <span className="text-xs font-bold ml-1">({r.savings_percentage}%)</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-4">
        {/* Problem statement */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Observed Problem
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">{r.problem}</p>
        </div>

        {/* Recommended Action */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Recommended Action
          </span>
          <p className="text-xs text-slate-800 font-medium leading-relaxed">{r.recommended_action}</p>
        </div>

        {/* Expandable Details Section */}
        {expanded && (
          <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Likely Root Cause
              </span>
              <p className="text-xs text-slate-600">{r.possible_cause}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Spend</span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{formatAmount(r.current_cost)}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Optimized Spend</span>
                <div className="text-xs font-bold text-brand-700 mt-0.5">{formatAmount(r.optimized_estimated_cost)}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Risk Level</span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{r.risk_level || 'Low'}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">AI Confidence</span>
                <div className="text-xs font-bold text-emerald-600 mt-0.5">{Math.round((r.confidence || 0.92) * 100)}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
        >
          {expanded ? (
            <>
              Hide Details <ChevronUp className="w-3.5 h-3.5 ml-1" />
            </>
          ) : (
            <>
              View Root Cause & Metrics <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </>
          )}
        </button>

        <div className="flex items-center space-x-2">
          {/* Explain Tool Trace button */}
          <Button
            variant="outline"
            size="sm"
            icon={HelpCircle}
            onClick={() => onExplain && onExplain(r)}
          >
            Explain
          </Button>

          {/* Pending Approval Controls */}
          {r.approval_status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={XCircle}
                onClick={() => onReject && onReject(r.id)}
                disabled={isLoading}
                className="text-slate-600 hover:text-rose-600 hover:border-rose-300"
              >
                Reject
              </Button>
              <Button
                variant="success"
                size="sm"
                icon={Check}
                onClick={() => onApprove && onApprove(r.id)}
                isLoading={isLoading}
              >
                Approve
              </Button>
            </>
          )}

          {/* Approved: Ready to Simulate */}
          {r.approval_status === 'approved' && (
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              onClick={() => onSimulate && onSimulate(r.id)}
              isLoading={isLoading}
            >
              Simulate Action
            </Button>
          )}

          {/* Simulated Result Tag */}
          {r.approval_status === 'simulated' && (
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Simulated Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
