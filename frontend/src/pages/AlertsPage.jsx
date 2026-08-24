import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Send,
  Zap,
  ShieldAlert,
  Info,
  Clock
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';

const AlertsPage = () => {
  const { activeWorkspace } = useAuth();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [testingWebhook, setTestingWebhook] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/alerts?severity=${severityFilter}`);
      if (res.data?.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load alerts stream.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [activeWorkspace, severityFilter]);

  const handleMarkRead = async (id) => {
    try {
      const res = await api.put(`/alerts/${id}/read`);
      if (res.data?.success) {
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
      }
    } catch (err) {
      showToast('Failed to update alert.', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/alerts/${id}`);
      if (res.data?.success) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
        showToast('Alert dismissed.', 'info');
      }
    } catch (err) {
      showToast('Failed to delete alert.', 'error');
    }
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      const res = await api.post('/alerts/webhook/test');
      if (res.data?.success) {
        showToast('Simulated Slack/Email outbound critical webhook event dispatched!', 'success');
        await fetchAlerts();
      }
    } catch (err) {
      showToast('Webhook dispatch failed.', 'error');
    } finally {
      setTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Alerts & Event Dispatcher
            </h1>
            <Badge variant="primary" size="md">
              Real-time Monitoring
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Budget limit thresholds, sudden cost spikes, critical anomalies, and outbound webhook triggers.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={Send}
          isLoading={testingWebhook}
          onClick={handleTestWebhook}
          className="border-brand-200 text-brand-700 bg-brand-50/40 font-bold"
        >
          Test Outbound Critical Webhook
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit text-xs font-bold">
        {['all', 'critical', 'warning', 'info'].map((sev) => (
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

      {/* Alerts Stream */}
      {alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-card">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No active alerts</h4>
          <p className="text-xs text-slate-500 mt-1">
            Your multi-cloud environment is operating within allocated spending thresholds.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((al) => (
            <div
              key={al.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                al.is_read
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-50 border-brand-200 shadow-sm'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
                    al.severity === 'Critical'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : al.severity === 'Warning'
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge
                      variant={
                        al.severity === 'Critical'
                          ? 'critical'
                          : al.severity === 'Warning'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                      dot
                    >
                      {al.severity}
                    </Badge>
                    <span className="text-[11px] text-slate-400 font-semibold flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(al.created_at).toLocaleString()}
                    </span>
                    {!al.is_read && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-100 text-brand-700">
                        NEW
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{al.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{al.message}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 flex-shrink-0">
                {!al.is_read && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleMarkRead(al.id)}
                  >
                    Mark Read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="xs"
                  icon={Trash2}
                  className="text-slate-400 hover:text-rose-600"
                  onClick={() => handleDelete(al.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
