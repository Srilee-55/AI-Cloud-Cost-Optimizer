import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Rocket,
  Briefcase,
  Users2,
  IndianRupee,
  Cloud,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { activeWorkspace, refreshWorkspaces } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name || 'Cloud Operations Hub');
  const [accountType, setAccountType] = useState('Growing Business');
  const [selectedProviders, setSelectedProviders] = useState(['aws', 'azure']);
  const [monthlyBudget, setMonthlyBudget] = useState('15000');
  const [loading, setLoading] = useState(false);

  const accountTypes = [
    {
      id: 'Startup',
      title: 'Startup',
      desc: 'Early stage teams focused on runway preservation and cost-efficiency.',
      icon: Rocket,
    },
    {
      id: 'Growing Business',
      title: 'Growing Business',
      desc: 'Scaling cloud architecture across multiple microservices and teams.',
      icon: Briefcase,
    },
    {
      id: 'Enterprise/Professional',
      title: 'Enterprise / Professional',
      desc: 'Multi-account environments with strict RBAC, cost centers, and audit requirements.',
      icon: Building2,
    },
    {
      id: 'Individual/Freelancer',
      title: 'Individual / Freelancer',
      desc: 'Single developer managing pet projects or client infrastructure.',
      icon: Users2,
    },
    {
      id: 'Just Exploring / Demo',
      title: 'Just Exploring / Demo',
      desc: 'Evaluate autonomous Agentic AI optimization capabilities with demo data.',
      icon: Sparkles,
    },
  ];

  const cloudProviders = [
    { id: 'aws', name: 'Amazon Web Services (AWS)', tag: 'EC2, S3, RDS, Lambda' },
    { id: 'azure', name: 'Microsoft Azure', tag: 'Virtual Machines, Blob, Azure SQL' },
    { id: 'gcp', name: 'Google Cloud Platform (GCP)', tag: 'Compute Engine, Cloud Storage, BigQuery' },
  ];

  const toggleProvider = (id) => {
    if (selectedProviders.includes(id)) {
      if (selectedProviders.length > 1) {
        setSelectedProviders(selectedProviders.filter((p) => p !== id));
      }
    } else {
      setSelectedProviders([...selectedProviders, id]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.post('/workspaces/onboarding', {
        workspace_name: workspaceName,
        account_type: accountType,
        cloud_providers: selectedProviders,
        monthly_budget: parseFloat(monthlyBudget) || 10000.0,
      });

      await refreshWorkspaces();
      showToast('Workspace initialized! Welcome to your dashboard.', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast('Failed to save onboarding settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-brand-600 text-white shadow-sm ring-4 ring-brand-100'
                    : step > s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span
                className={`ml-2 text-xs font-semibold ${
                  step === s ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                {s === 1 ? 'Workspace Profile' : s === 2 ? 'Cloud Providers' : 'Budget & Launch'}
              </span>
              {s < 3 && <div className="w-12 sm:w-20 h-0.5 bg-slate-200 mx-3"></div>}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-card">
          {/* STEP 1: Workspace & Account Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Setup your Workspace</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Choose the business profile that best matches your cloud architecture.
                </p>
              </div>

              <Input
                label="Workspace / Company Name"
                type="text"
                placeholder="Acme Technologies Inc"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                icon={Building2}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Account Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accountTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = accountType === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => setAccountType(type.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/50 shadow-sm ring-1 ring-brand-500'
                            : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-1.5">
                          <div
                            className={`p-2 rounded-lg ${
                              isSelected ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-900">{type.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">{type.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="md"
                  icon={ArrowRight}
                  onClick={() => setStep(2)}
                  disabled={!workspaceName}
                >
                  Continue to Cloud Setup
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Cloud Providers */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Select Cloud Providers</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Which cloud platforms do you currently use or plan to optimize?
                </p>
              </div>

              <div className="space-y-3">
                {cloudProviders.map((prov) => {
                  const isChecked = selectedProviders.includes(prov.id);
                  return (
                    <div
                      key={prov.id}
                      onClick={() => toggleProvider(prov.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-brand-600 border-brand-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{prov.name}</div>
                          <div className="text-[11px] text-slate-500">{prov.tag}</div>
                        </div>
                      </div>
                      <Cloud className={`w-5 h-5 ${isChecked ? 'text-brand-600' : 'text-slate-400'}`} />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <Button variant="outline" size="md" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={ArrowRight}
                  onClick={() => setStep(3)}
                  disabled={selectedProviders.length === 0}
                >
                  Continue to Budget
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Monthly Budget & Launch */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Set Monthly Budget Baseline</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Define your monthly spending limit to power anomaly alerts and forecasting benchmarks.
                </p>
              </div>

              <Input
                label="Target Monthly Budget (₹ INR)"
                type="number"
                min="10000"
                step="5000"
                placeholder="1000000"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                icon={IndianRupee}
                helperText="You can adjust or create department budgets anytime in settings."
                required
              />

              <div className="p-4 bg-brand-50 rounded-xl border border-brand-200 text-xs text-brand-900 space-y-1">
                <div className="font-bold flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5 text-brand-600" />
                  Ready to activate Agentic AI Engine
                </div>
                <p className="text-[11px] text-brand-700 leading-relaxed">
                  Your workspace will be initialized with continuous anomaly detection, time-series forecasting, and automated rightsizing recommendations.
                </p>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <Button variant="outline" size="md" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  isLoading={loading}
                  icon={ArrowRight}
                  onClick={handleFinish}
                  className="font-bold shadow-md"
                >
                  Complete Setup & Open Cockpit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
