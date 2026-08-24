import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Cpu,
  BarChart3,
  AlertTriangle,
  FileText,
  PieChart,
  CheckCircle2,
  Lock,
  Layers,
  Check
} from 'lucide-react';
import Button from '../components/common/Button';

const LandingPage = () => {
  const agenticWorkflow = [
    { step: '1', title: 'Observe', desc: 'Monitors multi-cloud usage telemetry across AWS, Azure, and GCP.' },
    { step: '2', title: 'Collect Evidence', desc: 'Executes deterministic backend tools to query raw cost records, idle instances, and spikes.' },
    { step: '3', title: 'Reason & Plan', desc: 'Synthesizes mathematical models and Gemini AI reasoning to isolate inefficiencies.' },
    { step: '4', title: 'Recommend', desc: 'Generates explainable, prioritized recommendations with verified savings metrics.' },
    { step: '5', title: 'Human Approval', desc: 'Awaiting human authorization before performing any simulated operations.' },
    { step: '6', title: 'Simulate Action', desc: 'Safely calculates projected cost reduction and records audit telemetry without touching production.' },
  ];

  const features = [
    { title: 'Cloud Cost Ingestion', desc: 'Seamless CSV ingestion and multi-cloud API sync with duplicate detection and row validation.', icon: Layers },
    { title: 'Cost Velocity Analysis', desc: 'Deep-dive spending distribution across dimensions: services, teams, regions, and cost centers.', icon: BarChart3 },
    { title: 'Statistical Anomaly Detection', desc: 'Identifies unexpected positive cost spikes using rolling Z-scores and IQR outlier analysis.', icon: AlertTriangle },
    { title: 'Agentic AI Optimization', desc: 'Autonomous AI engine that collects real structured evidence and reasons over financial data.', icon: Sparkles },
    { title: 'Time-Series Forecasting', desc: 'Holts exponential smoothing with confidence intervals to predict 30-day budget variances.', icon: TrendingDown },
    { title: 'Enterprise RBAC & Security', desc: 'Granular role-based access control, workspace data isolation, and immutable audit logs.', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-brand-100">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              AI Cloud Cost Optimizer
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" icon={ArrowRight}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Agentic FinOps Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto mb-6">
          Optimize Cloud Costs with an Autonomous <span className="text-brand-600">Agentic AI</span> Layer.
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Not another static dashboard. Our AI agent investigates real cloud telemetry, calls backend tools, gathers structured evidence, explains root causes, and estimates actionable savings.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-14">
          <Link to="/register" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" icon={ArrowRight} className="w-full shadow-md font-bold">
              Start Free Optimization
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full">
              Explore Live Demo
            </Button>
          </Link>
        </div>

        {/* Hero Visual Mockup */}
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4 shadow-elevated max-w-5xl mx-auto overflow-hidden">
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-left">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-mono text-slate-400 ml-2">agent://cloud-optimizer.ai/session-trace</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                AI Optimization Plan Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 font-semibold uppercase">Total Run Rate</div>
                <div className="text-xl font-bold text-slate-900 mt-1">₹16,24,075/mo</div>
                <div className="text-[11px] text-slate-500 mt-1">Across AWS, Azure, GCP</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 font-semibold uppercase">Active Cost Anomalies</div>
                <div className="text-xl font-bold text-rose-600 mt-1">3 Spikes Identified</div>
                <div className="text-[11px] text-rose-600 mt-1">Z-Score &gt; 2.5 Outliers</div>
              </div>
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                <div className="text-xs text-emerald-800 font-semibold uppercase">Verified Potential Savings</div>
                <div className="text-xl font-bold text-emerald-700 mt-1">₹4,04,975/mo (24.9%)</div>
                <div className="text-[11px] text-emerald-700 mt-1">Rightsizing & Idle Cleanup</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agentic AI Difference Section */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Traditional Monitoring vs. Agentic AI
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Why static dashboards and simple chat prompts fall short for modern enterprise cloud environments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Level 1</div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Traditional Monitoring</h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start"><span className="text-slate-400 mr-2">•</span>Shows raw cost and usage graphs</li>
                <li className="flex items-start"><span className="text-slate-400 mr-2">•</span>Simple static threshold budget alerts</li>
                <li className="flex items-start"><span className="text-slate-400 mr-2">•</span>Requires manual engineering research</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card">
              <div className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-2">Level 2</div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Basic AI Chatbots</h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start"><span className="text-indigo-400 mr-2">•</span>Generates generic cost tips</li>
                <li className="flex items-start"><span className="text-indigo-400 mr-2">•</span>Hallucinates numbers without tools</li>
                <li className="flex items-start"><span className="text-indigo-400 mr-2">•</span>No execution trace or evidence validation</li>
              </ul>
            </div>

            <div className="bg-brand-50/50 p-6 rounded-2xl border-2 border-brand-500 shadow-card relative">
              <div className="absolute top-4 right-4 bg-brand-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                Our System
              </div>
              <div className="text-sm font-bold text-brand-700 uppercase tracking-wider mb-2">Level 3</div>
              <h3 className="text-lg font-bold text-brand-900 mb-3">Agentic AI Optimization</h3>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-start"><Check className="w-3.5 h-3.5 text-brand-600 mr-1.5 flex-shrink-0 mt-0.5" />Autonomously calls backend tools</li>
                <li className="flex items-start"><Check className="w-3.5 h-3.5 text-brand-600 mr-1.5 flex-shrink-0 mt-0.5" />Collects verified mathematical evidence</li>
                <li className="flex items-start"><Check className="w-3.5 h-3.5 text-brand-600 mr-1.5 flex-shrink-0 mt-0.5" />Human approval before safe simulation</li>
              </ul>
            </div>
          </div>

          {/* Workflow Sequence */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-center text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">
              The 6-Step Autonomous Workflow Lifecycle
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {agenticWorkflow.map((step) => (
                <div key={step.step} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs mb-2">
                    {step.step}
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{step.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Full-Stack Enterprise Cloud Intelligence
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Engineered for engineering managers, DevOps leads, and FinOps architects.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card hover:border-brand-200 hover:shadow-md transition-all">
                <div className="p-3 bg-brand-50 text-brand-600 rounded-xl w-fit mb-4 border border-brand-100">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-white">
              AI Cloud Cost Optimizer
            </span>
          </div>
          <div className="text-xs text-slate-400">
            © 2026 AI Cloud Cost Optimizer. All rights reserved. Strict Light Theme Enterprise UI.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
