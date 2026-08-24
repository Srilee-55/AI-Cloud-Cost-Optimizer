import React, { useState } from 'react';
import { Sliders, Sparkles, TrendingDown, IndianRupee } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import Card from '../common/Card';

const ImpactSimulationSlider = ({
  baseMonthlySpend = 19450.0,
  maxMonthlySavings = 4850.0,
  onCoverageChange,
}) => {
  const { formatAmount } = useCurrency();
  const [coverage, setCoverage] = useState(100);

  const factor = coverage / 100.0;
  const simulatedMonthlySavings = maxMonthlySavings * factor;
  const simulatedOptimizedSpend = Math.max(0, baseMonthlySpend - simulatedMonthlySavings);
  const simulatedAnnualSavings = simulatedMonthlySavings * 12;
  const simulatedSavingsPercent = baseMonthlySpend > 0 ? ((simulatedMonthlySavings / baseMonthlySpend) * 100).toFixed(1) : 0;

  const handleChange = (e) => {
    const val = Number(e.target.value);
    setCoverage(val);
    if (onCoverageChange) {
      onCoverageChange(val);
    }
  };

  return (
    <Card className="border-brand-200 shadow-card bg-gradient-to-br from-white to-slate-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-brand-50 text-brand-600 rounded-lg border border-brand-100">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Dynamic AI Impact Simulator</h4>
            <p className="text-xs text-slate-500">
              Simulate organizational adoption coverage across all flagged optimization candidates.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-brand-600 text-white text-xs font-bold rounded-full shadow-sm">
          {coverage}% Coverage Applied
        </span>
      </div>

      {/* Interactive Slider Input */}
      <div className="mb-6 px-1">
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={coverage}
          onChange={handleChange}
          className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2">
          <span>0% (No Changes)</span>
          <span>50% (Gradual Rollout)</span>
          <span>100% (Full Optimization)</span>
        </div>
      </div>

      {/* Dynamic Simulated Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Current Monthly Run-Rate</span>
          <div className="text-base font-bold text-slate-900 mt-1">{formatAmount(baseMonthlySpend)}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Simulated Optimized Spend</span>
          <div className="text-base font-bold text-brand-700 mt-1">{formatAmount(simulatedOptimizedSpend)}</div>
        </div>

        <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Monthly Savings</span>
          <div className="text-base font-bold text-emerald-700 mt-1">
            +{formatAmount(simulatedMonthlySavings)} ({simulatedSavingsPercent}%)
          </div>
        </div>

        <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Annualized Savings</span>
          <div className="text-base font-bold text-emerald-700 mt-1">
            +{formatAmount(simulatedAnnualSavings)}/yr
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ImpactSimulationSlider;
