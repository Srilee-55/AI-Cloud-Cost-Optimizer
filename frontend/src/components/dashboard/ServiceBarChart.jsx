import React from 'react';
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
import { useCurrency } from '../../contexts/CurrencyContext';
import Card from '../common/Card';

const ServiceBarChart = ({ breakdown = {} }) => {
  const { currentSymbol, convertAmount, formatAmount, formatCompactINR } = useCurrency();

  const chartData = Object.keys(breakdown)
    .map((k) => ({
      service: k,
      amount: breakdown[k] || 0,
      convertedAmount: convertAmount(breakdown[k] || 0),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-elevated text-xs">
          <div className="font-bold text-slate-800">{data.service}</div>
          <div className="text-brand-600 font-bold mt-0.5">{formatAmount(data.amount)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card title="Top Service Expenditure Drivers" subtitle="Highest spending cloud services (last 30 days)">
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No service breakdown available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatCompactINR ? formatCompactINR(val) : `${currentSymbol}${val}`}
              />
              <YAxis
                dataKey="service"
                type="category"
                stroke="#475569"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="convertedAmount" fill="#6366F1" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#4F46E5' : index === 1 ? '#6366F1' : '#818CF8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default ServiceBarChart;
