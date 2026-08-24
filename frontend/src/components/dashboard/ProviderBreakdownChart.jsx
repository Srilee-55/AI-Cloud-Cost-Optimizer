import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useCurrency } from '../../contexts/CurrencyContext';
import Card from '../common/Card';

const ProviderBreakdownChart = ({ breakdown = {} }) => {
  const { formatAmount } = useCurrency();

  const COLORS = {
    aws: '#FF9900',
    azure: '#0089D6',
    gcp: '#4285F4',
  };

  const chartData = Object.keys(breakdown).map((k) => ({
    name: k.toUpperCase(),
    value: breakdown[k] || 0,
    color: COLORS[k.toLowerCase()] || '#6366F1',
  }));

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-elevated text-xs">
          <div className="font-bold text-slate-800">{data.name}</div>
          <div className="text-slate-600 mt-0.5">
            {formatAmount(data.value)} <span className="text-slate-400">({pct}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card title="Provider Spend Distribution" subtitle="Share of spend by cloud ecosystem">
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No provider data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(val) => <span className="text-xs font-semibold text-slate-700">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default ProviderBreakdownChart;
