import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Layers,
  ArrowRight,
  Terminal,
  Clock
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import RecommendationCard from '../components/agent/RecommendationCard';
import ToolCallTraceVisualizer from '../components/agent/ToolCallTraceVisualizer';
import ImpactSimulationSlider from '../components/agent/ImpactSimulationSlider';

const AIOptimizationPage = () => {
  const { activeWorkspace } = useAuth();
  const { formatAmount } = useCurrency();
  const { showToast } = useToast();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentGoal, setAgentGoal] = useState('Execute comprehensive multi-cloud rightsizing and idle resource optimization');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // all, pending, approved, simulated
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [currentExplainRec, setCurrentExplainRec] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [latestAgentSummary, setLatestAgentSummary] = useState(null);

  const goalPresets = [
    'Comprehensive multi-cloud optimization',
    'Eliminate AWS idle compute and unattached storage',
    'Rightsize low CPU production instances (< 20%)',
    'Remediate critical cost anomalies and spikes',
  ];

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recommendations');
      if (res.data?.success) {
        setRecommendations(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load recommendations.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [activeWorkspace]);

  // Trigger Autonomous Agent Optimization Pipeline
  const handleRunAgent = async () => {
    setRunningAgent(true);
    setLatestAgentSummary(null);
    try {
      const res = await api.post('/agent/run', {
        goal: agentGoal,
        provider: selectedProvider,
      });

      if (res.data?.success) {
        setLatestAgentSummary(res.data.data.summary);
        showToast('Agentic AI pipeline completed with verified evidence!', 'success');
        await fetchRecommendations();
      }
    } catch (err) {
      showToast('Agent run failed. Please try again.', 'error');
    } finally {
      setRunningAgent(false);
    }
  };

  // Human-in-the-loop: Approve
  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await api.post(`/recommendations/${id}/approve`);
      if (res.data?.success) {
        showToast('Recommendation approved! Ready for simulation.', 'success');
        await fetchRecommendations();
      }
    } catch (err) {
      showToast('Failed to approve recommendation.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Human-in-the-loop: Reject
  const handleReject = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await api.post(`/recommendations/${id}/reject`, {
        action: 'reject',
        rejection_reason: 'Rejected during architectural review.',
      });
      if (res.data?.success) {
        showToast('Recommendation rejected.', 'info');
        await fetchRecommendations();
      }
    } catch (err) {
      showToast('Failed to reject recommendation.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Simulate Action
  const handleSimulate = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await api.post(`/recommendations/${id}/simulate`);
      if (res.data?.success) {
        showToast('Simulation succeeded! Cost reduction telemetry recorded in audit log.', 'success');
        await fetchRecommendations();
      }
    } catch (err) {
      showToast('Failed to simulate recommendation.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Explain Tool Trace Modal
  const handleExplain = (rec) => {
    setCurrentExplainRec(rec);
    setExplainModalOpen(true);
  };

  // Filter recommendations by active tab
  const filteredRecommendations = recommendations.filter((r) => {
    if (activeTab === 'pending') return r.approval_status === 'pending';
    if (activeTab === 'approved') return r.approval_status === 'approved';
    if (activeTab === 'simulated') return r.approval_status === 'simulated';
    if (activeTab === 'rejected') return r.approval_status === 'rejected';
    return true;
  });

  const totalPotentialSavings = recommendations.reduce((acc, r) => acc + r.estimated_savings, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Agentic AI Cost Optimizer
            </h1>
            <Badge variant="primary" size="md">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Autonomous Engine
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Observe → Collect Evidence → Reason → Plan → Recommend → Human Approval → Simulate Action
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-right">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Total Actionable Savings</span>
            <div className="text-base font-extrabold text-emerald-700">
              +{formatAmount(totalPotentialSavings)}/month
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous Agent Launcher Console */}
      <Card className="border-brand-300 shadow-elevated bg-gradient-to-br from-white via-brand-50/20 to-slate-50">
        <div className="flex items-center space-x-2.5 mb-3">
          <div className="p-2.5 rounded-xl bg-brand-600 text-white shadow-sm">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Agentic Execution Controller</h3>
            <p className="text-xs text-slate-500">
              Specify your optimization goal. The agent will execute backend tools, gather telemetry, and generate plans.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Optimization Goal / Directive
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={agentGoal}
                onChange={(e) => setAgentGoal(e.target.value)}
                placeholder="e.g. Find all underutilized compute instances and idle databases..."
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm"
              />
              <Button
                variant="primary"
                size="md"
                isLoading={runningAgent}
                icon={Sparkles}
                onClick={handleRunAgent}
                className="font-bold shadow-md flex-shrink-0"
              >
                Execute Agent Pipeline
              </Button>
            </div>
          </div>

          {/* Goal Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Presets:
            </span>
            {goalPresets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setAgentGoal(preset)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50/40 transition-colors shadow-sm"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Latest Agent Executive Summary Banner */}
        {latestAgentSummary && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-brand-200 text-xs text-slate-800 space-y-1 shadow-sm animate-in fade-in">
            <div className="flex items-center space-x-1.5 font-bold text-brand-700 uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Agentic Evidence Synthesis Result</span>
            </div>
            <p className="leading-relaxed font-medium">{latestAgentSummary}</p>
          </div>
        )}
      </Card>

      {/* Dynamic Impact Simulation Slider */}
      <ImpactSimulationSlider
        baseMonthlySpend={19450.0}
        maxMonthlySavings={totalPotentialSavings || 4850.0}
      />

      {/* Recommendations Management Tabs & Stream */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {[
              { id: 'all', label: `All Plans (${recommendations.length})` },
              { id: 'pending', label: `Pending Approval (${recommendations.filter((r) => r.approval_status === 'pending').length})` },
              { id: 'approved', label: `Approved (${recommendations.filter((r) => r.approval_status === 'approved').length})` },
              { id: 'simulated', label: `Simulated (${recommendations.filter((r) => r.approval_status === 'simulated').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500">
            Showing <b>{filteredRecommendations.length}</b> verified recommendations
          </span>
        </div>

        {/* Recommendations List */}
        {filteredRecommendations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-card">
            <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No recommendations in this status</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Execute an Agentic AI run above to analyze infrastructure and generate new optimization candidates.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onApprove={handleApprove}
                onReject={handleReject}
                onSimulate={handleSimulate}
                onExplain={handleExplain}
                isLoading={actionLoadingId === rec.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Explain Tool-Call Trace Modal */}
      <Modal
        isOpen={explainModalOpen}
        onClose={() => setExplainModalOpen(false)}
        title="AI Explainability & Tool Execution Trace"
        subtitle={`Audit evidence graph for: ${currentExplainRec?.title || ''}`}
        maxWidth="max-w-3xl"
        footer={
          <Button variant="primary" size="sm" onClick={() => setExplainModalOpen(false)}>
            Close Trace
          </Button>
        }
      >
        {currentExplainRec && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">Recommendation Objective:</div>
              <p className="text-slate-600">{currentExplainRec.recommended_action}</p>
            </div>

            <ToolCallTraceVisualizer
              toolTrace={
                typeof currentExplainRec.tool_trace_json === 'string'
                  ? JSON.parse(currentExplainRec.tool_trace_json || '[]')
                  : currentExplainRec.tool_trace_json || []
              }
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AIOptimizationPage;
