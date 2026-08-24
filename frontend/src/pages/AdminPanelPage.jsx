import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Activity,
  ShieldCheck,
  Server,
  Cpu,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Table from '../components/common/Table';

const AdminPanelPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [systemHealth, setSystemHealth] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [workspacesList, setWorkspacesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [healthRes, usersRes, wsRes] = await Promise.all([
        api.get('/admin/system-health'),
        api.get('/users'),
        api.get('/admin/workspaces'),
      ]);

      if (healthRes.data?.success) setSystemHealth(healthRes.data.data);
      if (usersRes.data?.success) setUsersList(usersRes.data.data);
      if (wsRes.data?.success) setWorkspacesList(wsRes.data.data);
    } catch (err) {
      showToast('Admin telemetry access restricted or failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      const res = await api.put(`/users/${userId}/role`, { role: newRole });
      if (res.data?.success) {
        showToast(`User role updated to ${newRole}`, 'success');
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      showToast('Failed to update user role.', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const userColumns = [
    {
      header: 'User',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.full_name}</div>
          <div className="text-[11px] text-slate-400">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Assigned Role',
      accessor: (row) => (
        <select
          value={row.role}
          onChange={(e) => handleRoleChange(row.id, e.target.value)}
          disabled={updatingUserId === row.id}
          className="rounded-lg border border-slate-300 bg-white text-xs font-semibold px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="Admin">Admin</option>
          <option value="Cloud Manager">Cloud Manager</option>
          <option value="Analyst">Analyst</option>
          <option value="User">User</option>
        </select>
      ),
    },
    {
      header: 'Account Status',
      accessor: (row) => (
        <Badge variant={row.is_active ? 'success' : 'danger'} size="sm">
          {row.is_active ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
    {
      header: 'Member Since',
      accessor: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Administrator Command Center
          </h1>
          <Badge variant="primary" size="md">
            Admin Authority
          </Badge>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          System health telemetry, global workspace directory, and tenant user administration.
        </p>
      </div>

      {/* System Telemetry Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">System Status</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {systemHealth?.status || 'HEALTHY'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">FastAPI Backend Operational</p>
        </Card>

        <Card className="bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Users</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {systemHealth?.total_users || usersList.length} Accounts
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Registered across workspaces</p>
        </Card>

        <Card className="bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Workspaces</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {systemHealth?.total_workspaces || workspacesList.length} Tenants
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Isolated multi-tenant boundaries</p>
        </Card>

        <Card className="bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">AI Engine</span>
            <Cpu className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-xl font-bold text-brand-700 mt-1">Google Gemini Ready</div>
          <p className="text-[11px] text-slate-400 mt-1">Deterministic FinOps fallback</p>
        </Card>
      </div>

      {/* User Management Table */}
      <Card title="Global User Management & RBAC Roles">
        <Table
          columns={userColumns}
          data={usersList}
          isLoading={loading}
        />
      </Card>
    </div>
  );
};

export default AdminPanelPage;
