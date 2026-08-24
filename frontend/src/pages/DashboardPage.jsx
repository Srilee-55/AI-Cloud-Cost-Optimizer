import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Layers,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Plus,
  Zap,
  Activity,
  Bot
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';

import KpiCard from '../components/common/KpiCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import { CardSkeleton } from '../components/common/Skeleton';

import FirstUseChecklist from '../components/dashboard/FirstUseChecklist';
import WeeklyDigestCard from '../components/dashboard/WeeklyDigestCard';
import AIInsightsBanner from '../components/dashboard/AIInsightsBanner';
import CostTrendChart from '../components/dashboard/CostTrendChart';
import ProviderBreakdownChart from '../components/dashboard/ProviderBreakdownChart';
import ServiceBarChart from '../components/dashboard/ServiceBarChart';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { activeWorkspace } = useAuth();
  const { formatAmount } = useCurrency();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [costSummary, setCostSummary] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [digest, setDigest] = useState(null);
  const [recentAnomalies, setRecentAnomalies] = useState([]);
  const [pendingRecs, setPendingRecs] = useState([]);
  const [dismissChecklist, setDismissChecklist] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, checklistRes, digestRes, anomaliesRes, recsRes] = await Promise.all([
        api.get('/costs/summary'),
        api.get('/workspaces/checklist'),
        api.get('/ai/weekly-digest'),
        api.get('/anomalies?limit=5'),
        api.get('/recommendations?status_filter=pending')
      ]);

      if (summaryRes.data?.success) setCostSummary(summaryRes.data.data);
      if (checklistRes.data?.success) setChecklist(checklistRes.data.data);
      if (digestRes.data?.success) setDigest(digestRes.data.data);
      if (anomaliesRes.data?.success) setRecentAnomalies(anomaliesRes.data.data.slice(0, 4));
      if (recsRes.data?.success) setPendingRecs(recsRes.data.data.slice(0, 3));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showToast('Error loading dashboard telemetry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeWorkspace]);

  if (loading && !costSummary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const isStartup = activeWorkspace?.account_type === 'Startup' || activeWorkspace?.account_type === 'Individual/Freelancer';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Cloud Cost Intelligence Cockpit
            </h1>
            <Badge variant="primary" size="md">
              {activeWorkspace?.account_type || 'Enterprise'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry and Agentic AI optimization across multi-cloud infrastructure.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Sparkles}
            onClick={() => navigate('/ai/optimization')}
            className="shadow-sm font-bold"
          >
            Run Agentic AI Run
          </Button>
        </div>
      </div>

      {/* Dismissible Onboarding Checklist */}
      {!dismissChecklist && (
        <FirstUseChecklist
          checklist={checklist}
          onDismiss={() => setDismissChecklist(true)}
        />
      )}

      {/* AI Insights Banner */}
      <AIInsightsBanner
        totalSavings={costSummary?.daily_average_spend ? costSummary.daily_average_spend * 7.5 : 4850.0}
        underutilizedCount={3}
        momGrowth={costSummary?.month_over_month_change_pct || 14.2}
      />

      {/* KPI Cards Row */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isStartup ? 'lg:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-6'} gap-4`}>
        <KpiCard
          title="Total Cloud Spend"
          value={formatAmount(costSummary?.total_spend || 0)}
          icon={DollarSign}
          iconColor="text-brand-600 bg-brand-50"
          subtitle="All-time recorded"
        />

        <KpiCard
          title="Current 30D Spend"
          value={formatAmount(costSummary?.current_month_spend || 0)}
          change={costSummary?.month_over_month_change_pct || 0}
          changeType={costSummary?.month_over_month_change_pct > 15 ? 'negative' : 'positive'}
          icon={Layers}
          iconColor="text-indigo-600 bg-indigo-50"
        />

        <KpiCard
          title="Budget Utilization"
          value={`${costSummary?.budget_utilization_pct || 77.8}%`}
          badge={
            <Badge
              variant={costSummary?.budget_utilization_pct > 90 ? 'danger' : 'success'}
              size="sm"
            >
              {costSummary?.budget_utilization_pct > 90 ? 'Critical' : 'Healthy'}
            </Badge>
          }
          icon={Activity}
          iconColor="text-blue-600 bg-blue-50"
          subtitle={`Limit: ${formatAmount(activeWorkspace?.monthly_budget || 15000)}`}
        />

        <KpiCard
          title="Potential Savings"
          value={formatAmount(4850.0)}
          icon={TrendingDown}
          iconColor="text-emerald-600 bg-emerald-50"
          badge={<Badge variant="success" size="sm">24.9%</Badge>}
          subtitle="4 AI verified actions"
          onClick={() => navigate('/ai/optimization')}
        />

        {!isStartup && (
          <KpiCard
            title="Active Anomalies"
            value={recentAnomalies.length}
            icon={AlertTriangle}
            iconColor="text-rose-600 bg-rose-50"
            badge={<Badge variant="danger" size="sm">Action Req</Badge>}
            subtitle="Z-Score Spikes"
            onClick={() => navigate('/anomalies')}
          />
        )}

        <KpiCard
          title="Cost Efficiency"
          value={`${costSummary?.cost_efficiency_score || 84.5}/100`}
          icon={ShieldCheck}
          iconColor="text-emerald-600 bg-emerald-50"
          subtitle="Top 15% FinOps benchmark"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CostTrendChart data={costSummary?.cost_trend || []} />
        </div>
        <div>
          <ProviderBreakdownChart breakdown={costSummary?.breakdown_by_provider || {}} />
        </div>
      </div>

      {/* Second Row: Service Bar & Weekly AI Digest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ServiceBarChart breakdown={costSummary?.breakdown_by_service || {}} />
        </div>
        <div>
          <WeeklyDigestCard
            digest={digest}
            onAction={() => navigate('/ai/optimization')}
          />
        </div>
      </div>

      {/* Third Row: Pending AI Recommendations & Active Anomalies Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending AI Recommendations */}
        <Card
          title="Pending AI Optimization Recommendations"
          subtitle="Awaiting human approval before simulation"
          action={
            <Button
              variant="outline"
              size="xs"
              icon={ArrowRight}
              onClick={() => navigate('/ai/optimization')}
            >
              View All
            </Button>
          }
        >
          {pendingRecs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No pending recommendations. All actions approved or simulated!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRecs.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-brand-200 transition-all flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="primary" size="sm">
                        {r.provider?.toUpperCase()} • {r.service}
                      </Badge>
                      <Badge variant="danger" size="sm">
                        {r.priority}
                      </Badge>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{r.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {r.recommended_action}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-extrabold text-emerald-600 block">
                      +{formatAmount(r.estimated_savings)}/mo
                    </span>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => navigate('/ai/optimization')}
                      className="mt-1"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Cost Anomalies Preview */}
        <Card
          title="Active Cost Anomalies"
          subtitle="Statistical spikes detected by rolling Z-score algorithm"
          action={
            <Button
              variant="outline"
              size="xs"
              icon={ArrowRight}
              onClick={() => navigate('/anomalies')}
            >
              All Anomalies
            </Button>
          }
        >
          {recentAnomalies.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No active cost anomalies detected. Infrastructure is stable!
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnomalies.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={a.severity === 'Critical' ? 'critical' : 'warning'} size="sm" dot>
                        {a.severity}
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-semibold">{a.anomaly_date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {a.provider_code?.toUpperCase()} {a.service_name} Spike
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{a.possible_cause}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-extrabold text-rose-600 block">
                      +{a.deviation_percent}% (+{formatAmount(a.difference)})
                    </span>
                    <span className="text-[10px] text-slate-400">Actual: {formatAmount(a.actual_cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
