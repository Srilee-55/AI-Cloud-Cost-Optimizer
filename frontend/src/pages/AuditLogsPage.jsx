import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Filter,
  Search,
  Clock,
  ShieldCheck,
  User,
  Terminal
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Table from '../components/common/Table';

const AuditLogsPage = () => {
  const { activeWorkspace } = useAuth();
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = filterAction ? `/audit?action=${filterAction}` : '/audit?limit=100';
      const res = await api.get(url);
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load audit logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeWorkspace, filterAction]);

  const columns = [
    {
      header: 'Action / Event',
      accessor: (row) => (
        <div className="flex items-center space-x-2">
          <Badge variant="primary" size="sm">
            {row.action}
          </Badge>
          <span className="font-semibold text-slate-800 text-xs">{row.resource_type}</span>
        </div>
      ),
    },
    {
      header: 'Actor / User',
      accessor: (row) => (
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
            {row.user_email?.charAt(0).toUpperCase() || 'S'}
          </div>
          <span className="text-xs text-slate-700 font-medium">{row.user_email}</span>
        </div>
      ),
    },
    {
      header: 'IP Address',
      accessor: (row) => <span className="font-mono text-xs text-slate-500">{row.ip_address || '127.0.0.1'}</span>,
    },
    {
      header: 'Event Details',
      className: 'max-w-xs',
      accessor: (row) => (
        <span className="text-xs text-slate-500 font-mono truncate block max-w-xs">
          {row.details_json}
        </span>
      ),
    },
    {
      header: 'Timestamp',
      align: 'right',
      accessor: (row) => (
        <span className="text-xs text-slate-400">
          {new Date(row.created_at).toLocaleString()}
        </span>
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
              System Audit & Compliance Logs
            </h1>
            <Badge variant="success" size="md">
              Immutable Trace
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail recording logins, AI optimization runs, recommendation approvals, and simulation actions.
          </p>
        </div>

        {/* Action Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white text-xs font-semibold px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Actions ({logs.length})</option>
            <option value="LOGIN">User Logins</option>
            <option value="AI_OPTIMIZATION_RUN">AI Optimization Runs</option>
            <option value="APPROVE_RECOMMENDATION">Approvals</option>
            <option value="SIMULATE_OPTIMIZATION">Simulations</option>
            <option value="GENERATE_REPORT">Report Generations</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <Table
        columns={columns}
        data={logs}
        isLoading={loading}
        emptyMessage="No audit logs recorded for the selected filter."
      />
    </div>
  );
};

export default AuditLogsPage;
