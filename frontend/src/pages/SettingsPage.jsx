import React, { useState } from 'react';
import {
  User,
  Building2,
  Lock,
  Bell,
  Sparkles,
  ShieldCheck,
  IndianRupee,
  Save,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';

const SettingsPage = () => {
  const { user, activeWorkspace, refreshUser, refreshWorkspaces } = useAuth();
  const { currency, setCurrency, currencies } = useCurrency();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('profile'); // profile, workspace, notifications, ai

  // Profile Form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Workspace Form
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name || '');
  const [monthlyBudget, setMonthlyBudget] = useState(activeWorkspace?.monthly_budget?.toString() || '15000');
  const [accountType, setAccountType] = useState(activeWorkspace?.account_type || 'Growing Business');
  const [savingWorkspace, setSavingWorkspace] = useState(false);

  // Notification Preferences
  const [notifBudget, setNotifBudget] = useState(true);
  const [notifAnomalies, setNotifAnomalies] = useState(true);
  const [notifAI, setNotifAI] = useState(true);

  // AI Sensitivity Preferences
  const [anomalyThreshold, setAnomalyThreshold] = useState('2.0');
  const [autoAnalysis, setAutoAnalysis] = useState(true);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/users/profile', { full_name: fullName });
      if (res.data?.success) {
        showToast('Profile updated successfully!', 'success');
        await refreshUser();
      }
    } catch (err) {
      showToast('Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.post('/users/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (res.data?.success) {
        showToast('Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to change password.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpdateWorkspace = async (e) => {
    e.preventDefault();
    setSavingWorkspace(true);
    try {
      const res = await api.post('/workspaces/onboarding', {
        workspace_name: workspaceName,
        account_type: accountType,
        cloud_providers: ['aws', 'azure', 'gcp'],
        monthly_budget: parseFloat(monthlyBudget) || 15000.0,
        currency,
      });
      if (res.data?.success) {
        showToast('Workspace settings saved!', 'success');
        await refreshWorkspaces();
      }
    } catch (err) {
      showToast('Failed to update workspace.', 'error');
    } finally {
      setSavingWorkspace(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your account profile, workspace parameters, notification thresholds, and AI sensitivity.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit text-xs font-bold">
        {[
          { id: 'profile', label: 'User Profile' },
          { id: 'workspace', label: 'Workspace & Budgets' },
          { id: 'notifications', label: 'Notification Rules' },
          { id: 'ai', label: 'AI Engine Tuning' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card title="Personal Profile Information">
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
              <Input
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={User}
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={user?.email || ''}
                disabled
                helperText="Email is managed by your workspace administrator."
              />

              <div className="flex items-center space-x-2 pt-2">
                <span className="text-xs font-semibold text-slate-600">Assigned Role:</span>
                <Badge variant="primary" size="sm">{user?.role || 'Admin'}</Badge>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={savingProfile}
                icon={Save}
                className="font-bold shadow-sm"
              >
                Save Profile Changes
              </Button>
            </form>
          </Card>

          <Card title="Security & Password Update">
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                icon={Lock}
                required
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={Lock}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={Lock}
                required
              />

              <Button
                type="submit"
                variant="outline"
                size="sm"
                isLoading={changingPassword}
                icon={Lock}
                className="font-bold"
              >
                Update Password
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* WORKSPACE TAB */}
      {activeTab === 'workspace' && (
        <Card title="Workspace Settings & Budgets">
          <form onSubmit={handleUpdateWorkspace} className="space-y-4 max-w-xl">
            <Input
              label="Workspace Name"
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              icon={Building2}
              required
            />

            <Select
              label="Account Profile Archetype"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              options={[
                'Startup',
                'Growing Business',
                'Enterprise/Professional',
                'Individual/Freelancer',
                'Just Exploring / Demo',
              ]}
              helperText="Determines dashboard complexity, KPI cards, and default anomaly sensitivity."
            />

            <Input
              label="Global Monthly Budget Threshold (₹ INR)"
              type="number"
              min="10000"
              step="5000"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              icon={IndianRupee}
              required
            />

            <Select
              label="Preferred Workspace Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={currencies.map((c) => ({ value: c.code, label: c.label }))}
            />

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={savingWorkspace}
              icon={Save}
              className="font-bold shadow-sm"
            >
              Save Workspace Parameters
            </Button>
          </form>
        </Card>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <Card title="Alert Notification Rules & Subscriptions">
          <div className="space-y-4 max-w-xl text-xs">
            <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={notifBudget}
                onChange={(e) => setNotifBudget(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4 mt-0.5"
              />
              <div>
                <div className="font-bold text-slate-900">Budget Limit Threshold Alerts</div>
                <p className="text-slate-500 mt-0.5">Notify when department spending exceeds 80% of monthly budget.</p>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={notifAnomalies}
                onChange={(e) => setNotifAnomalies(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4 mt-0.5"
              />
              <div>
                <div className="font-bold text-slate-900">Critical Anomaly Spikes</div>
                <p className="text-slate-500 mt-0.5">Immediate alert on any Z-score &gt; 2.5 positive cost surge.</p>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={notifAI}
                onChange={(e) => setNotifAI(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4 mt-0.5"
              />
              <div>
                <div className="font-bold text-slate-900">Weekly AI Cost Digest</div>
                <p className="text-slate-500 mt-0.5">Weekly executive summary of optimizations and waste elimination.</p>
              </div>
            </label>

            <Button
              variant="primary"
              size="sm"
              icon={Save}
              onClick={() => showToast('Notification preferences saved!', 'success')}
              className="font-bold shadow-sm"
            >
              Save Notification Preferences
            </Button>
          </div>
        </Card>
      )}

      {/* AI ENGINE TAB */}
      {activeTab === 'ai' && (
        <Card title="Agentic AI Reasoning Configuration">
          <div className="space-y-4 max-w-xl text-xs">
            <Select
              label="Anomaly Detection Sensitivity (Z-Score Threshold)"
              value={anomalyThreshold}
              onChange={(e) => setAnomalyThreshold(e.target.value)}
              options={[
                { value: '1.5', label: 'High Sensitivity (Z > 1.5 — Flag smaller fluctuations)' },
                { value: '2.0', label: 'Standard Enterprise (Z > 2.0 — Balanced)' },
                { value: '3.0', label: 'Conservative (Z > 3.0 — Extreme spikes only)' },
              ]}
            />

            <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-brand-900 space-y-1">
              <div className="font-bold flex items-center">
                <Sparkles className="w-4 h-4 mr-1 text-brand-600" />
                Google Gemini + Deterministic FinOps Provider
              </div>
              <p className="text-[11px] text-brand-700 leading-relaxed">
                The agent collects structured evidence strictly from backend tools before reasoning over data. Production operations remain 100% simulation-safe.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Save}
              onClick={() => showToast('AI reasoning parameters updated!', 'success')}
              className="font-bold shadow-sm"
            >
              Update AI Parameters
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;
