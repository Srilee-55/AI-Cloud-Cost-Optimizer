import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Activity,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Table from '../components/common/Table';

const CostForecastingPage = () => {
  const { activeWorkspace } = useAuth();
  const { formatAmount, currentSymbol, convertAmount, formatCompactINR } = useCurrency();
  const { showToast } = useToast();

  const [forecast, setForecast] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/forecast?days=${days}`);
      if (res.data?.success) {
        setForecast(res.data.data);
      }
    } catch (err) {
      showToast('Failed to compute time-series forecast.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [activeWorkspace, days]);

  const chartData = (forecast?.daily_predictions || []).map((p) => ({
    ...p,
    convertedPred: convertAmount(p.predicted_cost),
    convertedUpper: convertAmount(p.upper_bound),
    convertedLower: convertAmount(p.lower_bound),
    displayDate: p.date ? p.date.substring(5) : '',
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-elevated text-xs space-y-1">
          <div className="font-bold text-slate-900">{d.date}</div>
          <div className="text-brand-600 font-extrabold text-sm">
            Predicted: {formatAmount(d.predicted_cost)}
          </div>
          <div className="text-slate-500 text-[11px]">
            Confidence Range: {formatAmount(d.lower_bound)} – {formatAmount(d.upper_bound)}
          </div>
          <div className="text-[10px] text-slate-400">Confidence: {Math.round(d.confidence_score * 100)}%</div>
        </div>
      );
    }
    return null;
  };

  const tableColumns = [
    {
      header: 'Forecast Date',
      accessor: (row) => <span className="font-semibold text-slate-800">{row.date}</span>,
    },
    {
      header: 'Predicted Spend',
      align: 'right',
      accessor: (row) => <span className="font-bold text-brand-700">{formatAmount(row.predicted_cost)}</span>,
    },
    {
      header: 'Lower Bound (95% CI)',
      align: 'right',
      accessor: (row) => <span className="text-xs text-slate-500">{formatAmount(row.lower_bound)}</span>,
    },
    {
      header: 'Upper Bound (95% CI)',
      align: 'right',
      accessor: (row) => <span className="text-xs text-slate-500">{formatAmount(row.upper_bound)}</span>,
    },
    {
      header: 'Confidence Score',
      align: 'right',
      accessor: (row) => (
        <Badge variant="primary" size="sm">
          {Math.round(row.confidence_score * 100)}%
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Predictive Cost Forecasting
            </h1>
            <Badge variant="info" size="md">
              Double Exponential Smoothing
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Statistical projection modeling 7-day and 30-day budget velocity with confidence intervals.
          </p>
        </div>

        {/* Horizon Selector */}
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
          <span className="text-slate-400 px-2 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            Horizon:
          </span>
          {[7, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                days === d
                  ? 'bg-brand-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-50">
          <span className="text-xs font-semibold text-slate-500 uppercase">7-Day Projected Total</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatAmount(forecast?.forecast_7d_total || 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Next 7 days run-rate</p>
        </Card>

        <Card className="bg-slate-50">
          <span className="text-xs font-semibold text-slate-500 uppercase">30-Day Projected Total</span>
          <div className="text-2xl font-extrabold text-brand-700 mt-1">
            {formatAmount(forecast?.forecast_30d_total || 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Full monthly outlook</p>
        </Card>

        <Card className="bg-slate-50">
          <span className="text-xs font-semibold text-slate-500 uppercase">Monthly Budget Target</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatAmount(forecast?.monthly_budget || 15000)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Allocated threshold</p>
        </Card>

        <Card
          className={
            forecast?.budget_overrun_risk
              ? 'bg-rose-50/50 border-rose-200'
              : 'bg-emerald-50/50 border-emerald-200'
          }
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase ${
                forecast?.budget_overrun_risk ? 'text-rose-800' : 'text-emerald-800'
              }`}
            >
              Budget Variance Risk
            </span>
            {forecast?.budget_overrun_risk ? (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <div
            className={`text-2xl font-extrabold mt-1 ${
              forecast?.budget_overrun_risk ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {forecast?.budget_overrun_risk
              ? `+${formatAmount(forecast?.budget_variance)} Over`
              : `${formatAmount(Math.abs(forecast?.budget_variance || 0))} Under`}
          </div>
          <p className="text-[11px] mt-1 text-slate-500">
            {forecast?.budget_overrun_risk ? 'Overrun likely without optimization' : 'Safely within monthly envelope'}
          </p>
        </Card>
      </div>

      {/* Main Forecast Chart */}
      <Card
        title={`${days}-Day Forecast Envelope & Confidence Bounds`}
        subtitle="Holt's linear exponential smoothing trajectory with 95% uncertainty bands"
      >
        <div className="h-80 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Generating time-series projections...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="predGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="boundGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatCompactINR ? formatCompactINR(val) : `${currentSymbol}${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Upper and Lower bounds */}
                <Area
                  type="monotone"
                  dataKey="convertedUpper"
                  stroke="#CBD5E1"
                  strokeDasharray="4 4"
                  fill="url(#boundGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="convertedPred"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  fill="url(#predGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Daily Projections Table */}
      <Card title="Daily Breakdown Forecast Data">
        <Table
          columns={tableColumns}
          data={forecast?.daily_predictions || []}
          isLoading={loading}
        />
      </Card>
    </div>
  );
};

export default CostForecastingPage;
