import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Table from '../components/common/Table';

const AnomalyDetectionPage = () => {
  const { activeWorkspace } = useAuth();
  const { formatAmount } = useCurrency();
  const { showToast } = useToast();

  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [resolvingId, setResolvingId] = useState(null);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/anomalies?severity=${severityFilter}`);
      if (res.data?.success) {
        setAnomalies(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load anomaly telemetry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [activeWorkspace, severityFilter]);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      const res = await api.put(`/anomalies/${id}/resolve`);
      if (res.data?.success) {
        showToast('Anomaly marked as resolved.', 'success');
        await fetchAnomalies();
      }
    } catch (err) {
      showToast('Failed to resolve anomaly.', 'error');
    } finally {
      setResolvingId(null);
    }
  };

  const columns = [
    {
      header: 'Severity',
      accessor: (row) => (
        <Badge
          variant={row.severity === 'Critical' ? 'critical' : row.severity === 'Warning' ? 'warning' : 'info'}
          size="sm"
          dot
        >
          {row.severity}
        </Badge>
      ),
    },
    {
      header: 'Date',
      accessor: (row) => <span className="font-semibold text-slate-800 text-xs">{row.anomaly_date}</span>,
    },
    {
      header: 'Cloud Service & Target',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900">
            {row.provider_code?.toUpperCase()} {row.service_name}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">{row.resource_id}</div>
        </div>
      ),
    },
    {
      header: 'Actual vs Expected',
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900">{formatAmount(row.actual_cost)}</span>
          <span className="text-[11px] text-slate-400 block">Baseline: {formatAmount(row.expected_cost)}</span>
        </div>
      ),
    },
    {
      header: 'Spike Variance',
      align: 'right',
      accessor: (row) => (
        <div className="text-right">
          <span className="font-extrabold text-rose-600">+{row.deviation_percent}%</span>
          <span className="text-[11px] text-rose-500 block">+{formatAmount(row.difference)}</span>
        </div>
      ),
    },
    {
      header: 'Root Cause & Action',
      className: 'max-w-xs',
      accessor: (row) => (
        <div className="space-y-1 py-1">
          <p className="text-xs text-slate-700 font-medium leading-tight line-clamp-2">
            {row.possible_cause}
          </p>
          <p className="text-[11px] text-brand-700 bg-brand-50/70 p-1.5 rounded border border-brand-100 line-clamp-2">
            <b>Action:</b> {row.recommended_action}
          </p>
        </div>
      ),
    },
    {
      header: 'Status & Action',
      align: 'right',
      accessor: (row) => (
        <div className="flex items-center justify-end space-x-2">
          {row.status === 'resolved' ? (
            <span className="inline-flex items-center text-xs font-bold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Resolved
            </span>
          ) : (
            <Button
              variant="outline"
              size="xs"
              isLoading={resolvingId === row.id}
              onClick={() => handleResolve(row.id)}
            >
              Resolve
            </Button>
          )}
        </div>
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
              Cost Anomaly Detection Engine
            </h1>
            <Badge variant="danger" size="md">
              Statistical Z-Score & IQR
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time statistical anomaly surveillance identifying unexpected cost surges and runaway cluster jobs.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
          {['all', 'critical', 'warning'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
                severityFilter === sev
                  ? 'bg-slate-900 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-rose-50/50 border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase">Critical Anomalies</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700 mt-2">
            {anomalies.filter((a) => a.severity === 'Critical' && a.status === 'active').length} Events
          </div>
          <p className="text-[11px] text-rose-600 mt-1">Deviations &gt; 150% above 7-day rolling average</p>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase">Warning Anomalies</span>
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-2">
            {anomalies.filter((a) => a.severity === 'Warning' && a.status === 'active').length} Events
          </div>
          <p className="text-[11px] text-amber-600 mt-1">Deviations &gt; 50% above baseline</p>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase">Resolved Inactive</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {anomalies.filter((a) => a.status === 'resolved').length} Events
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Mitigated and archived</p>
        </Card>
      </div>

      {/* Anomalies Table */}
      <Table
        columns={columns}
        data={anomalies}
        isLoading={loading}
        emptyMessage="No cost anomalies found for the selected filter."
      />
    </div>
  );
};

export default AnomalyDetectionPage;
