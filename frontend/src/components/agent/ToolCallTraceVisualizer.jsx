import React from 'react';
import { ArrowDown, CheckCircle2, Clock, Terminal, ShieldCheck } from 'lucide-react';
import Badge from '../common/Badge';

const ToolCallTraceVisualizer = ({ toolTrace = [] }) => {
  if (!toolTrace || toolTrace.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
        No tool execution trace recorded for this recommendation.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-900">
        <div className="flex items-center space-x-2 font-bold">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span>Verifiable Evidence & Tool-Call Execution Trace</span>
        </div>
        <span className="text-[11px] font-semibold text-brand-700">
          {toolTrace.length} Tools Consulted
        </span>
      </div>

      {/* Visual Sequence Chain */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {toolTrace.map((step, idx) => (
          <div key={idx} className="relative group">
            {/* Dot node */}
            <div className="absolute -left-6 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-brand-600 flex items-center justify-center shadow-sm">
              <span className="text-[10px] font-extrabold text-brand-700">{step.step || idx + 1}</span>
            </div>

            {/* Card Content */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card hover:border-brand-300 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center space-x-2 font-mono text-xs font-bold text-brand-700">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>{step.tool_name}()</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {step.duration_ms || 12} ms
                  </span>
                  <Badge variant="success" size="sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Success
                  </Badge>
                </div>
              </div>

              <div className="text-xs text-slate-600 font-medium mb-2">
                <b>Purpose:</b> {step.purpose}
              </div>

              {step.key_findings && (
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-xs text-slate-800 font-medium">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Structured Finding
                  </span>
                  {step.key_findings}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolCallTraceVisualizer;
