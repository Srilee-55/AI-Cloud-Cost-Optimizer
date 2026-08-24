import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, TrendingDown, Cpu, ArrowRight } from 'lucide-react';

const AuthLayout = () => {
  const steps = [
    { num: '1', title: 'Observe & Ingest', desc: 'Continuous telemetry across AWS, Azure, and GCP' },
    { num: '2', title: 'Collect Evidence', desc: 'Autonomous backend tool execution against cost data' },
    { num: '3', title: 'Reason & Plan', desc: 'Deterministic anomaly scoring and savings modeling' },
    { num: '4', title: 'Human Approval & Simulation', desc: 'Safe simulation without destructive infrastructure changes' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Value Proposition (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 via-indigo-900 to-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              AI Cloud Cost Optimizer
            </span>
          </Link>
        </div>

        {/* Hero Highlights */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-800/80 border border-brand-700 text-brand-200 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous FinOps Intelligence</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight mb-4">
            Transform Multi-Cloud Waste into Measurable Capital Efficiency.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-lg mb-8">
            Anticipate cost overruns, automatically isolate root-cause anomalies, and review data-backed optimization recommendations validated by backend tool traces.
          </p>

          {/* Agentic Workflow Steps */}
          <div className="space-y-3.5 max-w-md">
            {steps.map((s) => (
              <div
                key={s.num}
                className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {s.num}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{s.title}</h4>
                  <p className="text-[11px] text-slate-300">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="relative z-10 flex items-center space-x-6 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Enterprise Multi-Tenant Security</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Google Gemini Enabled</span>
          </div>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-12 bg-slate-50">
        <div className="mx-auto w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
