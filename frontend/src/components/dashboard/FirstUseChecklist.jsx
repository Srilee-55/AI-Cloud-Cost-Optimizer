import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, X } from 'lucide-react';
import Button from '../common/Button';

const FirstUseChecklist = ({ checklist = {}, onDismiss }) => {
  const navigate = useNavigate();

  const items = [
    {
      key: 'connect_provider',
      title: 'Connect Cloud Provider',
      desc: 'Link AWS, Azure, or GCP accounts to stream telemetry',
      path: '/cloud/accounts',
      completed: !!checklist.connect_provider,
    },
    {
      key: 'upload_cost_data',
      title: 'Import Cost Telemetry',
      desc: 'Upload a billing CSV or enter manual cost records',
      path: '/cloud/data',
      completed: !!checklist.upload_cost_data,
    },
    {
      key: 'configure_budget',
      title: 'Set Spending Budgets',
      desc: 'Establish monthly threshold alerts for cost centers',
      path: '/settings',
      completed: !!checklist.configure_budget,
    },
    {
      key: 'run_ai_analysis',
      title: 'Execute First AI Analysis',
      desc: 'Let the agent collect evidence and detect inefficiencies',
      path: '/ai/optimization',
      completed: !!checklist.run_ai_analysis,
    },
    {
      key: 'review_recommendation',
      title: 'Approve & Simulate Recommendation',
      desc: 'Review data-backed findings and simulate cost savings',
      path: '/ai/optimization',
      completed: !!checklist.review_recommendation,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const progressPct = Math.round((completedCount / items.length) * 100);

  if (completedCount === items.length && !onDismiss) return null;

  return (
    <div className="bg-white rounded-2xl border border-brand-200 p-6 shadow-card mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900">Getting Started with Agentic FinOps</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              {completedCount}/{items.length} Completed ({progressPct}%)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete the verification checklist to unlock autonomous cost optimizations.
          </p>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 mb-5 overflow-hidden">
        <div
          className="bg-brand-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.key}
            onClick={() => navigate(item.path)}
            className={`flex items-start p-3.5 rounded-xl border transition-all cursor-pointer ${
              item.completed
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-brand-300 hover:shadow-sm'
            }`}
          >
            <div className="mt-0.5 mr-3 flex-shrink-0">
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Circle className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold ${item.completed ? 'text-emerald-900' : 'text-slate-800'}`}>
                  {item.title}
                </span>
                {item.completed && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-300">
                    Done
                  </span>
                )}
              </div>
              <p className={`text-[11px] mt-0.5 truncate ${item.completed ? 'text-emerald-700/80' : 'text-slate-500'}`}>{item.desc}</p>
            </div>
            {!item.completed && <ArrowRight className="w-4 h-4 text-slate-400 ml-2 mt-0.5 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FirstUseChecklist;
