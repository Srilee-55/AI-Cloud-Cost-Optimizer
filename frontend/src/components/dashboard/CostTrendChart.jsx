import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCurrency } from '../../contexts/CurrencyContext';
import Card from '../common/Card';

const CostTrendChart = ({ data = [] }) => {
  const { currentSymbol, convertAmount, formatAmount, formatCompactINR } = useCurrency();

  const formattedData = data.map((d) => ({
    ...d,
    convertedAmount: convertAmount(d.amount),
    displayDate: d.date ? d.date.substring(5) : '',
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const originalAmount = payload[0].payload.amount;
      return (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-elevated text-xs">
          <div className="font-semibold text-slate-500 mb-1">{payload[0].payload.date}</div>
          <div className="font-bold text-brand-600 text-sm">
            {formatAmount(originalAmount)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card title="30-Day Cost Velocity Trend" subtitle="Daily expenditure telemetry across all connected accounts">
      <div className="h-64 w-full">
        {formattedData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No cost history available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatCompactINR ? formatCompactINR(val) : `${currentSymbol}${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="convertedAmount"
                stroke="#4F46E5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#costGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default CostTrendChart;
