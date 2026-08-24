import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  IndianRupee,
  Calendar,
  Layers,
  Sparkles,
  Download
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Table from '../components/common/Table';

const CostDataPage = () => {
  const { activeWorkspace } = useAuth();
  const { formatAmount } = useCurrency();
  const { showToast } = useToast();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upload'); // upload, manual, history

  // Manual Form State
  const [manualProvider, setManualProvider] = useState('aws');
  const [manualService, setManualService] = useState('EC2');
  const [manualResourceId, setManualResourceId] = useState('');
  const [manualRegion, setManualRegion] = useState('us-east-1');
  const [manualDate, setManualDate] = useState(new Date().toISOString().substring(0, 10));
  const [manualAmount, setManualAmount] = useState('');
  const [manualCostCenter, setManualCostCenter] = useState('Engineering');
  const [manualTeam, setManualTeam] = useState('Platform');
  const [manualEnv, setManualEnv] = useState('Production');
  const [submittingManual, setSubmittingManual] = useState(false);

  // CSV Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Seeding State
  const [seeding, setSeeding] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/costs?limit=100');
      if (res.data?.success) {
        setRecords(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load cost records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeWorkspace]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualAmount || isNaN(manualAmount)) {
      showToast('Please enter a valid cost amount.', 'error');
      return;
    }

    setSubmittingManual(true);
    try {
      const res = await api.post('/data/manual', {
        provider_code: manualProvider,
        service_name: manualService,
        resource_id: manualResourceId || `${manualProvider}-${manualService.toLowerCase()}-res`,
        region: manualRegion,
        cost_date: manualDate,
        amount: parseFloat(manualAmount),
        currency: 'USD',
        cost_center: manualCostCenter,
        team: manualTeam,
        environment: manualEnv,
      });

      if (res.data?.success) {
        showToast('Cost record added successfully!', 'success');
        setManualAmount('');
        setManualResourceId('');
        await fetchRecords();
      }
    } catch (err) {
      showToast('Failed to save manual cost record.', 'error');
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select a CSV file first.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    setUploadResult(null);
    try {
      const res = await api.post('/data/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setUploadResult(res.data.data);
        showToast(`Imported ${res.data.data.inserted_records_count} records from CSV!`, 'success');
        setSelectedFile(null);
        await fetchRecords();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'CSV upload failed.';
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        showToast('Please drop a valid .csv file.', 'error');
      }
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const res = await api.post('/data/seed-demo');
      if (res.data?.success) {
        showToast('Demo dataset populated with multi-cloud history & anomalies!', 'success');
        await fetchRecords();
      }
    } catch (err) {
      showToast('Failed to seed demo data.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: (row) => <span className="font-semibold text-slate-800">{row.cost_date}</span>,
    },
    {
      header: 'Provider',
      accessor: (row) => (
        <Badge variant="primary" size="sm">
          {row.provider_code?.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Service & Resource',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.service_name}</div>
          <div className="text-[11px] text-slate-400 font-mono">{row.resource_id}</div>
        </div>
      ),
    },
    {
      header: 'Cost Center & Team',
      accessor: (row) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">{row.cost_center}</div>
          <div className="text-[11px] text-slate-500">{row.team}</div>
        </div>
      ),
    },
    {
      header: 'Amount',
      align: 'right',
      accessor: (row) => (
        <span className="font-bold text-slate-900">{formatAmount(row.amount)}</span>
      ),
    },
    {
      header: 'Source',
      accessor: (row) => (
        <Badge variant={row.source === 'csv' ? 'info' : row.source === 'manual' ? 'warning' : 'default'} size="sm">
          {row.source}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Cost Data Ingestion & Collection
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Import multi-cloud billing exports via CSV or record custom expenditures manually.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={Sparkles}
          isLoading={seeding}
          onClick={handleSeedDemo}
          className="border-brand-200 text-brand-700 bg-brand-50/50"
        >
          Seed Realistic Demo Data
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'upload' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-500'
          }`}
        >
          CSV Upload
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'manual' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-500'
          }`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-500'
          }`}
        >
          Cost Records Stream ({records.length})
        </button>
      </div>

      {/* CSV UPLOAD TAB */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h3 className="text-base font-bold text-slate-900 mb-1">Upload Billing Export (CSV)</h3>
            <p className="text-xs text-slate-500 mb-4">
              Securely parse and ingest multi-cloud cost records with automatic column normalization and validation.
            </p>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  dragActive
                    ? 'border-brand-500 bg-brand-50/50'
                    : 'border-slate-300 bg-slate-50 hover:bg-white hover:border-slate-400'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-brand-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800 mb-1">
                  Drag and drop your cost CSV file here, or{' '}
                  <label className="text-brand-600 hover:text-brand-700 cursor-pointer underline">
                    browse
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">Supported formats: CSV (up to 10MB)</p>

                {selectedFile && (
                  <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-800">
                    <FileSpreadsheet className="w-4 h-4 text-brand-600" />
                    <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={UploadCloud}
                  isLoading={uploading}
                  disabled={!selectedFile}
                  className="font-bold shadow-sm"
                >
                  Upload & Normalize Records
                </Button>
              </div>
            </form>

            {uploadResult && (
              <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 animate-in fade-in">
                <div className="font-bold text-emerald-900 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Successfully processed {uploadResult.inserted_records_count} records
                </div>
                <div className="text-emerald-800">
                  Total rows scanned: {uploadResult.total_rows_processed}
                </div>
              </div>
            )}
          </Card>

          {/* Guidelines Box */}
          <Card title="CSV Format Requirements" subtitle="Recommended columns for accurate analysis">
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Supported Headers:</div>
                <div className="font-mono text-[11px] text-slate-700">
                  Provider, Service, Amount, Date, Resource ID, Cost Center, Team
                </div>
              </div>

              <p className="leading-relaxed">
                The ingestion pipeline automatically maps common cloud billing exports (AWS Cost Explorer CSV, Azure Cost Management CSV, Google Cloud Billing export) into unified multi-tenant schema.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* MANUAL ENTRY TAB */}
      {activeTab === 'manual' && (
        <Card className="max-w-3xl">
          <h3 className="text-base font-bold text-slate-900 mb-1">Manual Cost Record Entry</h3>
          <p className="text-xs text-slate-500 mb-5">
            Log custom cloud expenditures, on-premise amortizations, or unlinked SaaS infrastructure.
          </p>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Cloud Provider"
                value={manualProvider}
                onChange={(e) => setManualProvider(e.target.value)}
                options={[
                  { value: 'aws', label: 'AWS' },
                  { value: 'azure', label: 'Azure' },
                  { value: 'gcp', label: 'GCP' },
                ]}
              />

              <Input
                label="Service Name"
                type="text"
                placeholder="e.g. EC2, RDS, BigQuery, Blob"
                value={manualService}
                onChange={(e) => setManualService(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Resource Identifier (Optional)"
                type="text"
                placeholder="i-09ab12cd34ef5601"
                value={manualResourceId}
                onChange={(e) => setManualResourceId(e.target.value)}
              />

              <Input
                label="Cloud Region"
                type="text"
                placeholder="us-east-1"
                value={manualRegion}
                onChange={(e) => setManualRegion(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Cost Date"
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                required
              />

              <Input
                label="Cost Amount (₹ INR)"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="12500.00"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                icon={IndianRupee}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Cost Center"
                type="text"
                placeholder="Engineering"
                value={manualCostCenter}
                onChange={(e) => setManualCostCenter(e.target.value)}
              />
              <Input
                label="Team"
                type="text"
                placeholder="Platform Core"
                value={manualTeam}
                onChange={(e) => setManualTeam(e.target.value)}
              />
              <Select
                label="Environment"
                value={manualEnv}
                onChange={(e) => setManualEnv(e.target.value)}
                options={['Production', 'Staging', 'Development', 'QA']}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={submittingManual}
                icon={Plus}
                className="font-bold shadow-sm"
              >
                Save Cost Record
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* HISTORY TABLE */}
      {activeTab === 'history' && (
        <Table
          columns={columns}
          data={records}
          isLoading={loading}
          emptyMessage="No cost records logged yet."
        />
      )}
    </div>
  );
};

export default CostDataPage;
