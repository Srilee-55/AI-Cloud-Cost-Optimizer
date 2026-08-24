import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  Users,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

const SecurityManagementPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSecurity = async () => {
    setLoading(true);
    try {
      const res = await api.get('/security/overview');
      if (res.data?.success) {
        setSecurityData(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load security telemetry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurity();
  }, []);

  const rolesList = [
    {
      role: 'Admin',
      badge: 'primary',
      desc: 'Full administrative authority. Can trigger AI runs, approve recommendations, manage users, and export reports.',
      permissions: ['All CRUD', 'Simulate Action', 'Manage Roles', 'Audit Logs', 'Export PDF/CSV'],
    },
    {
      role: 'Cloud Manager',
      badge: 'info',
      desc: 'Manages cloud provider connections, sets up budgets, imports CSV billing data, and simulates actions.',
      permissions: ['Connect Cloud', 'Upload CSV', 'Simulate Action', 'Manage Budgets', 'View Reports'],
    },
    {
      role: 'Analyst',
      badge: 'warning',
      desc: 'Read-only financial analysis, anomaly investigation, and custom reporting.',
      permissions: ['View Costs', 'Run AI Analysis', 'Inspect Anomalies', 'Export Reports'],
    },
    {
      role: 'User',
      badge: 'default',
      desc: 'Standard developer / team view. Can explore dashboard and chat with AI Copilot.',
      permissions: ['View Dashboard', 'Chat with Copilot', 'Inspect Recommendations'],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Security, RBAC & Multi-Tenancy
          </h1>
          <Badge variant="success" size="md">
            Enterprise Grade
          </Badge>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographic token security, workspace tenant isolation, role-based access controls, and rate limit telemetry.
        </p>
      </div>

      {/* Security Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">JWT Encryption</span>
            <Key className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2">HS256 (256-bit Signature)</div>
          <p className="text-[11px] text-slate-400 mt-1">60-min access / 7-day refresh rotation</p>
        </Card>

        <Card className="bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Password Security</span>
            <Lock className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2">Bcrypt with Random Salt</div>
          <p className="text-[11px] text-slate-400 mt-1">Adaptive work factor 12 rounds</p>
        </Card>

        <Card className="bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tenant Isolation</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-emerald-700 mt-2">Strict Workspace Guards</div>
          <p className="text-[11px] text-slate-400 mt-1">Enforced at API Gateway and DB layer</p>
        </Card>

        <Card className="bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Rate Limiting</span>
            <Activity className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2">120 Requests / Minute</div>
          <p className="text-[11px] text-slate-400 mt-1">Token bucket anti-DDoS protection</p>
        </Card>
      </div>

      {/* RBAC Roles Matrix */}
      <Card title="Role-Based Access Control (RBAC) Matrix" subtitle="Defined system roles and their capability sets">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rolesList.map((r) => (
            <div key={r.role} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{r.role}</span>
                <Badge variant={r.badge} size="sm">
                  {r.role === user?.role ? 'Your Current Role' : 'Role'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{r.desc}</p>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Granted Permissions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {r.permissions.map((perm, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[11px] font-medium"
                    >
                      ✓ {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SecurityManagementPage;
