import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Layers,
  Sparkles,
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';

import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

const AnalyticsPage = () => {
  const { activeWorkspace } = useAuth();
  const { formatAmount, currentSymbol, convertAmount, formatCompactINR } = useCurrency();
  const { showToast } = useToast();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/multi-dimensional');
      if (res.data?.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load multi-dimensional analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeWorkspace]);

  // Transform stacked data for currency conversion
  const stackedData = (analytics?.stacked_trend || []).map((d) => ({
    ...d,
    awsConverted: convertAmount(d.aws || 0),
    azureConverted: convertAmount(d.azure || 0),
    gcpConverted: convertAmount(d.gcp || 0),
    displayDate: d.date ? d.date.substring(5) : '',
  }));

  const anomalyPieData = analytics?.anomaly_distribution
    ? [
        { name: 'Critical', value: analytics.anomaly_distribution.Critical || 0, color: '#EF4444' },
        { name: 'Warning', value: analytics.anomaly_distribution.Warning || 0, color: '#F59E0B' },
        { name: 'Normal', value: analytics.anomaly_distribution.Normal || 0, color: '#3B82F6' },
      ]
    : [];

  const recPieData = analytics?.recommendation_status_distribution
    ? [
        { name: 'Pending', value: analytics.recommendation_status_distribution.pending || 0, color: '#F59E0B' },
        { name: 'Approved', value: analytics.recommendation_status_distribution.approved || 0, color: '#6366F1' },
        { name: 'Simulated', value: analytics.recommendation_status_distribution.simulated || 0, color: '#10B981' },
        { name: 'Rejected', value: analytics.recommendation_status_distribution.rejected || 0, color: '#94A3B8' },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Visual Analytics Hub
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Multi-dimensional spending dynamics, cross-cloud stacked velocity, team allocations, and pipeline status.
        </p>
      </div>

      {/* Multi-Cloud Stacked Area Chart */}
      <Card
        title="Multi-Cloud Daily Expenditure Run-Rate"
        subtitle="Stacked area velocity by cloud provider (last 30 days)"
      >
        <div className="h-72 w-full">
          {stackedData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Loading multi-cloud telemetry...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stackedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="displayDate" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatCompactINR ? formatCompactINR(val) : `${currentSymbol}${val}`}
                />
                <Tooltip
                  formatter={(val, name) => [
                    formatAmount(val),
                    name.replace('Converted', '').toUpperCase(),
                  ]}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="top"
                  formatter={(val) => (
                    <span className="text-xs font-bold text-slate-700">
                      {val.replace('Converted', '').toUpperCase()}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="awsConverted"
                  name="aws"
                  stackId="1"
                  stroke="#FF9900"
                  fill="#FF9900"
                  fillOpacity={0.7}
                />
                <Area
                  type="monotone"
                  dataKey="azureConverted"
                  name="azure"
                  stackId="1"
                  stroke="#0089D6"
                  fill="#0089D6"
                  fillOpacity={0.7}
                />
                <Area
                  type="monotone"
                  dataKey="gcpConverted"
                  name="gcp"
                  stackId="1"
                  stroke="#4285F4"
                  fill="#4285F4"
                  fillOpacity={0.7}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Row 2: Team Allocations & Distribution Pies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team vs Cost Center Allocations */}
        <Card
          title="Team & Cost Center Spend Matrix"
          subtitle="Expenditure by organizational unit"
          className="lg:col-span-2"
        >
          <div className="h-64 w-full">
            {!analytics?.team_allocations || analytics.team_allocations.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No team allocations recorded
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.team_allocations.slice(0, 7)}
                  margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="team"
                    stroke="#64748B"
                    fontSize={10}
                    angle={-15}
                    textAnchor="end"
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => formatCompactINR ? formatCompactINR(val) : `${currentSymbol}${val}`}
                  />
                  <Tooltip
                    formatter={(val) => [formatAmount(val), 'Spend']}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* AI Recommendations Pipeline Status */}
        <Card title="Optimization Pipeline Lifecycle" subtitle="Approval status breakdown">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={recPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {recPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} items`, name]}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => <span className="text-xs font-semibold text-slate-700">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
