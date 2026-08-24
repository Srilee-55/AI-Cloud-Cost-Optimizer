import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Table from '../components/common/Table';

const CloudAccountsPage = () => {
  const { activeWorkspace } = useAuth();
  const { showToast } = useToast();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [syncingId, setSyncingId] = useState(null);

  const [newProvider, setNewProvider] = useState('aws');
  const [newAccountId, setNewAccountId] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newEnvironment, setNewEnvironment] = useState('Production');
  const [isDemo, setIsDemo] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cloud/accounts');
      if (res.data?.success) {
        setAccounts(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load cloud accounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [activeWorkspace]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newAccountId || !newAccountName) {
      showToast('Please fill all required account fields.', 'error');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/cloud/accounts', {
        provider_code: newProvider,
        account_id: newAccountId,
        account_name: newAccountName,
        environment: newEnvironment,
        is_demo: isDemo,
      });

      if (res.data?.success) {
        showToast('Cloud account connected successfully!', 'success');
        setModalOpen(false);
        setNewAccountId('');
        setNewAccountName('');
        await fetchAccounts();
      }
    } catch (err) {
      showToast('Failed to connect cloud account.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleSync = async (id, name) => {
    setSyncingId(id);
    try {
      const res = await api.post(`/cloud/accounts/${id}/sync`);
      if (res.data?.success) {
        showToast(`Synchronized telemetry for ${name}`, 'success');
        await fetchAccounts();
      }
    } catch (err) {
      showToast('Sync failed.', 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove account "${name}"?`)) return;

    try {
      const res = await api.delete(`/cloud/accounts/${id}`);
      if (res.data?.success) {
        showToast('Account removed.', 'info');
        await fetchAccounts();
      }
    } catch (err) {
      showToast('Failed to delete account.', 'error');
    }
  };

  const columns = [
    {
      header: 'Provider & Account',
      accessor: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs uppercase text-slate-700">
            {row.provider?.code || 'Cloud'}
          </div>
          <div>
            <div className="font-bold text-slate-900">{row.account_name}</div>
            <div className="text-[11px] text-slate-400 font-mono">ID: {row.account_id}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Environment',
      accessor: (row) => (
        <Badge
          variant={row.environment === 'Production' ? 'primary' : 'default'}
          size="sm"
        >
          {row.environment}
        </Badge>
      ),
    },
    {
      header: 'Connection Status',
      accessor: (row) => (
        <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          {row.status}
        </span>
      ),
    },
    {
      header: 'Integration Mode',
      accessor: (row) => (
        <Badge variant={row.is_demo ? 'warning' : 'info'} size="sm">
          {row.is_demo ? 'Simulated / Demo' : 'Live Connected'}
        </Badge>
      ),
    },
    {
      header: 'Last Sync',
      accessor: (row) => (
        <span className="text-xs text-slate-500">
          {row.last_synced_at ? new Date(row.last_synced_at).toLocaleString() : 'Just now'}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (row) => (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="xs"
            icon={RefreshCw}
            isLoading={syncingId === row.id}
            onClick={() => handleSync(row.id, row.account_name)}
          >
            Sync
          </Button>
          <Button
            variant="ghost"
            size="xs"
            icon={Trash2}
            className="text-slate-400 hover:text-rose-600"
            onClick={() => handleDelete(row.id, row.account_name)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Cloud Accounts & Credentials</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage connected cloud environments across AWS, Microsoft Azure, and Google Cloud Platform.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setModalOpen(true)}
          className="shadow-sm font-bold"
        >
          Connect Cloud Account
        </Button>
      </div>

      {/* Cloud Table */}
      <Table
        columns={columns}
        data={accounts}
        isLoading={loading}
        emptyMessage="No cloud accounts connected. Click 'Connect Cloud Account' above to begin."
      />

      {/* Connect Account Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Connect New Cloud Account"
        subtitle="Establish telemetry stream for continuous cost optimization"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={creating}
              onClick={handleCreate}
            >
              Save & Authorize
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Cloud Provider"
            value={newProvider}
            onChange={(e) => setNewProvider(e.target.value)}
            options={[
              { value: 'aws', label: 'Amazon Web Services (AWS)' },
              { value: 'azure', label: 'Microsoft Azure' },
              { value: 'gcp', label: 'Google Cloud Platform (GCP)' },
            ]}
          />

          <Input
            label="Account / Subscription Name"
            type="text"
            placeholder="Production Primary Hub"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            required
          />

          <Input
            label="Cloud Account ID / Subscription ID"
            type="text"
            placeholder="123456789012 or sub-az-001"
            value={newAccountId}
            onChange={(e) => setNewAccountId(e.target.value)}
            required
          />

          <Select
            label="Environment Tag"
            value={newEnvironment}
            onChange={(e) => setNewEnvironment(e.target.value)}
            options={['Production', 'Staging', 'Development', 'Disaster Recovery']}
          />

          <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-xs text-brand-900 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
            <div className="leading-relaxed">
              <b>Academic / Demo Integration Mode:</b> All cloud connections use read-only telemetry sync and non-destructive simulated action models.
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CloudAccountsPage;
