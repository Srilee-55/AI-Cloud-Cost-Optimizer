import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Globe,
  Filter,
  DollarSign
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Table from '../components/common/Table';

const CostAnalysisPage = () => {
  const { activeWorkspace } = useAuth();
  const { currency, setCurrency, currencies, formatAmount, currentSymbol, formatCompactINR } = useCurrency();
  const { showToast } = useToast();

  const [dimension, setDimension] = useState('service');
  const [period, setPeriod] = useState('30d');
  const [breakdownData, setBreakdownData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('breakdown'); // breakdown, comparison

  const fetchBreakdown = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        api.get(`/analysis/breakdown?dimension=${dimension}&period=${period}&currency=${currency}`),
        api.get('/analysis/compare-periods'),
      ]);

      if (bRes.data?.success) setBreakdownData(bRes.data.data);
      if (cRes.data?.success) setComparisonData(cRes.data.data);
    } catch (err) {
      showToast('Failed to load cost analysis data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreakdown();
  }, [activeWorkspace, dimension, period, currency]);

  const breakdownColumns = [
    {
      header: dimension.replace('_', ' ').toUpperCase(),
      accessor: (row) => <span className="font-bold text-slate-900">{row.name}</span>,
    },
    {
      header: 'Spend Share',
      accessor: (row) => (
        <div className="flex items-center space-x-2 w-36">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-brand-600 h-2 rounded-full"
              style={{ width: `${row.percentage}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-600">{row.percentage}%</span>
        </div>
      ),
    },
    {
      header: `Cost (${currency})`,
      align: 'right',
      accessor: (row) => (
        <span className="font-bold text-slate-900">
          {currentSymbol}{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Records',
      align: 'right',
      accessor: (row) => <span className="text-xs text-slate-500">{row.record_count}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Multi-Cloud Cost Analysis
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deep-dive into expenditure distributions, dimensions, period shifts, and currency conversions.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
          <span className="text-slate-400 px-2 flex items-center">
            <Globe className="w-3.5 h-3.5 mr-1" />
            Display Currency:
          </span>
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currency === c.code
                  ? 'bg-brand-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('breakdown')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'breakdown' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-500'
          }`}
        >
          Dimensional Breakdown
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'comparison' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-500'
          }`}
        >
          Period-Over-Period Comparison
        </button>
      </div>

      {/* TAB 1: DIMENSIONAL BREAKDOWN */}
      {activeTab === 'breakdown' && (
        <div className="space-y-6">
          {/* Dimension Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-1">
                Dimension:
              </span>
              {[
                { id: 'service', label: 'Service' },
                { id: 'provider', label: 'Cloud Provider' },
                { id: 'region', label: 'Region' },
                { id: 'team', label: 'Team' },
                { id: 'cost_center', label: 'Cost Center' },
                { id: 'environment', label: 'Environment' },
              ].map((dim) => (
                <button
                  key={dim.id}
                  onClick={() => setDimension(dim.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dimension === dim.id
                      ? 'bg-brand-50 text-brand-700 border border-brand-200 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {dim.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-400 mr-1">Period:</span>
              {['7d', '30d', '90d'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    period === p ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Chart & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title={`Expenditure by ${dimension.replace('_', ' ').toUpperCase()}`}>
              <div className="h-72 w-full">
                {!breakdownData?.items || breakdownData.items.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No data available for this dimension
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={breakdownData.items.slice(0, 7)}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="name"
                        stroke="#64748B"
                        fontSize={10}
                        angle={-20}
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
                        formatter={(value) => [formatAmount(value), 'Cost']}
                        contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="amount" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Table */}
            <Table
              columns={breakdownColumns}
              data={breakdownData?.items || []}
              isLoading={loading}
            />
          </div>
        </div>
      )}

      {/* TAB 2: PERIOD COMPARISON */}
      {activeTab === 'comparison' && comparisonData && (
        <div className="space-y-6">
          {/* Summary Comparison Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase">Current 30 Days</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatAmount(comparisonData.period_a_total)}
              </div>
            </Card>

            <Card className="bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase">Previous 30 Days</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatAmount(comparisonData.period_b_total)}
              </div>
            </Card>

            <Card className="bg-brand-50/50 border-brand-200">
              <span className="text-xs font-semibold text-brand-800 uppercase">Period Shift</span>
              <div className="text-2xl font-extrabold text-brand-900 mt-1 flex items-center">
                {comparisonData.percentage_change > 0 ? (
                  <TrendingUp className="w-5 h-5 text-rose-600 mr-1.5" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-emerald-600 mr-1.5" />
                )}
                {comparisonData.percentage_change > 0 ? `+${comparisonData.percentage_change}%` : `${comparisonData.percentage_change}%`}
              </div>
            </Card>
          </div>

          {/* Provider Comparison Row */}
          <Card title="Multi-Cloud Shift: AWS vs Azure vs GCP">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {comparisonData.provider_comparison?.map((p) => (
                <div key={p.provider} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="text-xs font-bold text-slate-700 uppercase">{p.provider}</div>
                  <div className="text-lg font-extrabold text-slate-900 mt-1">
                    {formatAmount(p.current_spend)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Prev: {formatAmount(p.previous_spend)}{' '}
                    <span className={`font-bold ${p.growth_percentage > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ({p.growth_percentage > 0 ? `+${p.growth_percentage}%` : `${p.growth_percentage}%`})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Service Comparison Table */}
          <Card title="Service-by-Service Cost Variance">
            <div className="space-y-3">
              {comparisonData.service_comparison?.map((s) => (
                <div
                  key={s.service}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white transition-all text-xs"
                >
                  <span className="font-bold text-slate-900 text-sm">{s.service}</span>
                  <div className="flex items-center space-x-6 text-right">
                    <div>
                      <span className="text-slate-400 block text-[10.5px]">Current 30d</span>
                      <span className="font-bold text-slate-800">{formatAmount(s.current_spend)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10.5px]">Previous 30d</span>
                      <span className="font-semibold text-slate-600">{formatAmount(s.previous_spend)}</span>
                    </div>
                    <div className="w-24">
                      <span
                        className={`inline-flex items-center font-bold px-2 py-0.5 rounded ${
                          s.growth_percentage > 10
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {s.growth_percentage > 0 ? `+${s.growth_percentage}%` : `${s.growth_percentage}%`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CostAnalysisPage;
