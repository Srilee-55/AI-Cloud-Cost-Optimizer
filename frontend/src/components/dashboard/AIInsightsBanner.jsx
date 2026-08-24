import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import Button from '../common/Button';

const AIInsightsBanner = ({ totalSavings = 4850.0, underutilizedCount = 3, momGrowth = 14.2 }) => {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();

  return (
    <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 rounded-2xl p-6 text-white shadow-elevated mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start space-x-3.5">
        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 flex-shrink-0">
          <Sparkles className="w-6 h-6 text-amber-300 animate-pulse-subtle" />
        </div>
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold text-brand-100 tracking-wide uppercase mb-1.5 border border-white/10">
            <Zap className="w-3 h-3 text-amber-300" />
            <span>Active Optimization Opportunity</span>
          </div>
          <h3 className="text-lg font-extrabold text-white">
            AWS compute spend grew by {momGrowth}% with {underutilizedCount} underutilized instances detected.
          </h3>
          <p className="text-xs text-brand-100 mt-1 max-w-2xl leading-relaxed">
            Autonomous agent investigation identified verified rightsizing and idle cleanup opportunities yielding an estimated{' '}
            <span className="font-bold text-white underline decoration-amber-300 decoration-2">{formatAmount(totalSavings)}/month</span>{' '}
            in immediate capital savings.
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        size="md"
        icon={ArrowRight}
        onClick={() => navigate('/ai/optimization')}
        className="bg-white text-brand-700 hover:bg-slate-50 border-white shadow-sm font-bold flex-shrink-0 w-full md:w-auto"
      >
        View Recommendations
      </Button>
    </div>
  );
};

export default AIInsightsBanner;
