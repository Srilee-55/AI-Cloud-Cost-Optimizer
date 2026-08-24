import React, { useState, useEffect } from 'react';
import {
  PiggyBank,
  TrendingDown,
  Sparkles,
  Sliders,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  RotateCcw,
  Clock,
  Cpu,
  HardDrive,
  CheckCircle,
  HelpCircle,
  Filter,
  ArrowUpDown,
  Zap,
  Info
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
import ImpactSimulationSlider from '../components/agent/ImpactSimulationSlider';

const DEFAULT_SAMPLE_RESOURCES = [
  {
    cloud_provider: 'aws',
    resource_id: 'i-09ab12cd34ef',
    resource_name: 'prod-api-backend-01',
    resource_type: 'compute',
    service_name: 'EC2',
    region: 'ap-south-1',
    monthly_cost: 18500,
    cpu_utilization: 12.5,
    memory_utilization: 18.0,
    storage_usage_gb: 100,
    hours_per_day: 24,
    environment: 'Production',
    status: 'running'
  },
  {
    cloud_provider: 'aws',
    resource_id: 'vol-0847b2c910fa',
    resource_name: 'legacy-unattached-ebs',
    resource_type: 'storage',
    service_name: 'EBS',
    region: 'ap-south-1',
    monthly_cost: 3200,
    cpu_utilization: null,
    memory_utilization: null,
    storage_usage_gb: 500,
    hours_per_day: 24,
    environment: 'Staging',
    status: 'unattached'
  },
  {
    cloud_provider: 'azure',
    resource_id: 'vm-dev-worker-02',
    resource_name: 'staging-test-worker',
    resource_type: 'compute',
    service_name: 'Virtual Machines',
    region: 'centralindia',
    monthly_cost: 12400,
    cpu_utilization: 8.0,
    memory_utilization: 14.0,
    storage_usage_gb: 50,
    hours_per_day: 10,
    environment: 'Development',
    status: 'running'
  },
  {
    cloud_provider: 'gcp',
    resource_id: 'gcs-archive-data-lake',
    resource_name: 'customer-events-lake',
    resource_type: 'storage',
    service_name: 'Cloud Storage',
    region: 'asia-south1',
    monthly_cost: 9500,
    cpu_utilization: null,
    memory_utilization: null,
    storage_usage_gb: 2500,
    hours_per_day: 24,
    environment: 'Production',
    status: 'running'
  },
  {
    cloud_provider: 'aws',
    resource_id: 'i-03fa45de7890',
    resource_name: 'dev-qa-cluster-node',
    resource_type: 'compute',
    service_name: 'EC2',
    region: 'ap-south-1',
    monthly_cost: 8800,
    cpu_utilization: 4.0,
    memory_utilization: 6.0,
    storage_usage_gb: 40,
    hours_per_day: 8,
    environment: 'Development',
    status: 'running'
  }
];

const SavingsEstimationPage = () => {
  const { activeWorkspace } = useAuth();
  const { formatAmount } = useCurrency();
  const { showToast } = useToast();

  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // View state: 'view' | 'form' | 'csv'
  const [mode, setMode] = useState('view');

  // Interactive Builder Rows
  const [resources, setResources] = useState([]);

  // Filters & Sorting
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('savings_desc'); // savings_desc, risk_asc, confidence_desc, effort_asc

  // CSV Drag and drop state
  const [csvFile, setCsvFile] = useState(null);
  const [csvError, setCsvError] = useState(null);

  // Initial load: check if workspace has existing resources
  const fetchWorkspaceSavings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/savings');
      if (res.data?.success && res.data.data.opportunities_count > 0) {
        setAnalysisData(res.data.data);
      } else {
        // Clean empty state (No fake numbers)
        setAnalysisData(null);
      }
    } catch (err) {
      // Clean fallback to empty state
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceSavings();
  }, [activeWorkspace]);

  // Execute Analysis with Animated Stepper
  const runAnalysis = async (resourcesToAnalyze) => {
    if (!resourcesToAnalyze || resourcesToAnalyze.length === 0) {
      showToast('Please add at least one cloud resource to analyze.', 'error');
      return;
    }

    setLoading(true);
    setLoadingStep(1);

    const stepsTimer1 = setTimeout(() => setLoadingStep(2), 600);
    const stepsTimer2 = setTimeout(() => setLoadingStep(3), 1200);

    try {
      const res = await api.post('/savings/analyze', {
        resources: resourcesToAnalyze,
        analysis_period: '30d',
        currency: 'INR'
      });

      if (res.data?.success) {
        setTimeout(() => {
          setAnalysisData(res.data.data);
          setMode('view');
          setLoading(false);
          setLoadingStep(0);
          showToast(`Analysis complete! Identified ${res.data.data.opportunities_count} optimization opportunities.`, 'success');
        }, 1600);
      }
    } catch (err) {
      clearTimeout(stepsTimer1);
      clearTimeout(stepsTimer2);
      setLoading(false);
      setLoadingStep(0);
      const detail = err.response?.data?.detail || 'Failed to complete savings analysis. Please check your data.';
      showToast(detail, 'error');
    }
  };

  // Add Resource Row to Interactive Builder
  const handleAddResourceRow = () => {
    setResources([
      ...resources,
      {
        id: `temp-${Date.now()}`,
        cloud_provider: 'aws',
        resource_id: `res-${Math.random().toString(36).substring(2, 8)}`,
        resource_name: '',
        resource_type: 'compute',
        service_name: 'EC2',
        region: 'ap-south-1',
        monthly_cost: 5000,
        cpu_utilization: 15.0,
        memory_utilization: 25.0,
        storage_usage_gb: null,
        hours_per_day: 24,
        environment: 'Production',
        status: 'running'
      }
    ]);
  };

  const handleUpdateRow = (index, field, value) => {
    const updated = [...resources];
    updated[index][field] = value;
    setResources(updated);
  };

  const handleRemoveRow = (index) => {
    const updated = resources.filter((_, i) => i !== index);
    setResources(updated);
  };

  // Load Sample Dataset helper
  const handleLoadSampleData = () => {
    setResources([...DEFAULT_SAMPLE_RESOURCES]);
    setMode('form');
    showToast('Loaded 5 sample cloud resources. You can edit any field or click Analyze.', 'info');
  };

  // CSV Parsing
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setCsvError('Please select a valid .csv file.');
      return;
    }

    setCsvFile(file);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setCsvError('CSV file is empty or missing data rows.');
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
        const parsedResources = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/['"]/g, ''));
          if (cols.length < 3) continue;

          const rowData = {};
          headers.forEach((h, idx) => {
            rowData[h] = cols[idx] || '';
          });

          const monthlyCost = parseFloat(rowData.monthly_cost || rowData.cost || '0');
          if (isNaN(monthlyCost) || monthlyCost < 0) continue;

          parsedResources.push({
            cloud_provider: rowData.cloud_provider || 'aws',
            resource_id: rowData.resource_id || `csv-res-${i}`,
            resource_name: rowData.resource_name || rowData.resource_id || `Resource ${i}`,
            resource_type: rowData.resource_type || 'compute',
            service_name: rowData.service_name || 'Compute',
            region: rowData.region || 'ap-south-1',
            monthly_cost: monthlyCost,
            cpu_utilization: rowData.cpu_utilization ? parseFloat(rowData.cpu_utilization) : null,
            memory_utilization: rowData.memory_utilization ? parseFloat(rowData.memory_utilization) : null,
            storage_usage_gb: rowData.storage_usage_gb ? parseFloat(rowData.storage_usage_gb) : null,
            hours_per_day: rowData.hours_per_day ? parseFloat(rowData.hours_per_day) : 24,
            environment: rowData.environment || 'Production',
            status: rowData.status || 'running'
          });
        }

        if (parsedResources.length === 0) {
          setCsvError('No valid resource rows could be parsed from CSV. Please check formatting.');
          return;
        }

        setResources(parsedResources);
        setMode('form');
        showToast(`Parsed ${parsedResources.length} resources from CSV! Review below and analyze.`, 'success');
      } catch (err) {
        setCsvError('Failed to parse CSV file. Please ensure it conforms to standard comma-separated format.');
      }
    };
    reader.readAsText(file);
  };

  // Filter and Sort Opportunities
  const filteredOpportunities = (analysisData?.opportunities || [])
    .filter((opp) => {
      if (categoryFilter === 'all') return true;
      return opp.category === categoryFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'savings_desc') {
        return b.estimated_monthly_savings - a.estimated_monthly_savings;
      }
      if (sortBy === 'risk_asc') {
        const order = { Low: 1, Medium: 2, High: 3 };
        return (order[a.risk_level] || 2) - (order[b.risk_level] || 2);
      }
      if (sortBy === 'confidence_desc') {
        return b.confidence_score - a.confidence_score;
      }
      if (sortBy === 'effort_asc') {
        const order = { Low: 1, Medium: 2, High: 3 };
        return (order[a.effort_level] || 2) - (order[b.effort_level] || 2);
      }
      return 0;
    });

  // Reset to Start Fresh
  const handleResetAnalysis = () => {
    setAnalysisData(null);
    setResources([]);
    setMode('view');
    setCsvFile(null);
    showToast('Analysis reset. You can enter or upload new data.', 'info');
  };

  // Loading Stepper UI
  if (loading && loadingStep > 0) {
    const steps = [
      { num: 1, title: 'Validating & Normalizing Data', desc: 'Validating resource inventory, utilization telemetry, and pricing schemas' },
      { num: 2, title: 'Detecting Optimization Opportunities', desc: 'Running rightsizing, idle cleanup, and scheduling algorithms' },
      { num: 3, title: 'Synthesizing Evidence & ROI', desc: 'AI agent calculating verified savings, risk scores, and implementation steps' }
    ];

    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-8">
        <div className="inline-flex p-4 rounded-3xl bg-brand-50 border border-brand-200 text-brand-600 animate-pulse">
          <Sparkles className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Executing FinOps Savings Engine</h2>
          <p className="text-sm text-slate-500 mt-1">Analyzing your submitted cloud infrastructure telemetry in real time...</p>
        </div>

        <div className="space-y-4 max-w-md mx-auto text-left">
          {steps.map((s) => {
            const isDone = loadingStep > s.num;
            const isCurrent = loadingStep === s.num;
            return (
              <div
                key={s.num}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-white border-brand-400 shadow-card'
                    : isDone
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-brand-600 text-white animate-spin'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{s.title}</div>
                    <p className="text-[11px] text-slate-500">{s.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              FinOps Savings & Optimization Engine
            </h1>
            <Badge variant="success" size="md">
              Evidence-Based
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Provide your cloud inventory and utilization telemetry to compute actionable, personalized rightsizing and waste reduction opportunities.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {analysisData && (
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={handleResetAnalysis}
              className="text-slate-700"
            >
              New Analysis
            </Button>
          )}

          {mode === 'view' && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={UploadCloud}
                onClick={() => setMode('csv')}
              >
                Upload CSV
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  if (resources.length === 0) {
                    handleAddResourceRow();
                  }
                  setMode('form');
                }}
              >
                {analysisData ? 'Modify Input Data' : 'Add Cost Data'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODE: CSV UPLOAD INTERFACE */}
      {/* ========================================================= */}
      {mode === 'csv' && (
        <Card title="Bulk Resource Telemetry Import via CSV" subtitle="Upload comma-separated resource records for instant mathematical FinOps analysis">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-8 text-center bg-slate-50/50 transition-all">
              <UploadCloud className="w-12 h-12 text-brand-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-900">Drag & drop your CSV file here, or click to browse</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Required columns: <code className="text-brand-700 bg-brand-50 px-1 py-0.5 rounded font-mono">resource_id, monthly_cost, cpu_utilization, environment</code>
              </p>

              <input
                type="file"
                accept=".csv"
                id="savings-csv-upload"
                onChange={handleCSVUpload}
                className="hidden"
              />

              <div className="mt-4 flex items-center justify-center space-x-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => document.getElementById('savings-csv-upload')?.click()}
                >
                  Browse CSV File
                </Button>
                <a
                  href="/api/savings/template/csv"
                  download="finops_savings_resources_template.csv"
                  className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Sample CSV Template
                </a>
              </div>

              {csvError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center justify-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{csvError}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setMode('view')}>
                Cancel
              </Button>
              <Button variant="secondary" size="sm" onClick={handleLoadSampleData}>
                Load Pre-Configured Sample Dataset
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* MODE: INTERACTIVE RESOURCE BUILDER TABLE */}
      {/* ========================================================= */}
      {mode === 'form' && (
        <Card
          title="Cloud Resource Inventory & Telemetry Input"
          subtitle="Provide resource metrics to calculate personalized, data-backed optimization recommendations"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                Entered <span className="font-bold text-slate-900">{resources.length}</span> resources for analysis.
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" icon={Plus} onClick={handleAddResourceRow}>
                  Add Resource Row
                </Button>
                <Button variant="secondary" size="sm" onClick={handleLoadSampleData}>
                  Load Sample Dataset
                </Button>
              </div>
            </div>

            {/* Resources Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-3 px-3">Provider</th>
                    <th className="py-3 px-3">Resource ID / Name</th>
                    <th className="py-3 px-3">Service & Type</th>
                    <th className="py-3 px-3">Monthly Cost (₹ INR)</th>
                    <th className="py-3 px-3">Avg CPU %</th>
                    <th className="py-3 px-3">Avg Mem %</th>
                    <th className="py-3 px-3">Hours/Day</th>
                    <th className="py-3 px-3">Environment</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {resources.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <select
                          value={row.cloud_provider}
                          onChange={(e) => handleUpdateRow(idx, 'cloud_provider', e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-brand-500"
                        >
                          <option value="aws">AWS</option>
                          <option value="azure">Azure</option>
                          <option value="gcp">GCP</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="e.g. i-09ab12cd"
                          value={row.resource_id}
                          onChange={(e) => handleUpdateRow(idx, 'resource_id', e.target.value)}
                          className="w-28 bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="EC2 / RDS / S3"
                          value={row.service_name}
                          onChange={(e) => handleUpdateRow(idx, 'service_name', e.target.value)}
                          className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          placeholder="15000"
                          value={row.monthly_cost}
                          onChange={(e) => handleUpdateRow(idx, 'monthly_cost', parseFloat(e.target.value) || 0)}
                          className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="e.g. 15"
                          value={row.cpu_utilization !== null ? row.cpu_utilization : ''}
                          onChange={(e) => handleUpdateRow(idx, 'cpu_utilization', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                          className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="e.g. 25"
                          value={row.memory_utilization !== null ? row.memory_utilization : ''}
                          onChange={(e) => handleUpdateRow(idx, 'memory_utilization', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                          className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          max="24"
                          step="1"
                          placeholder="24"
                          value={row.hours_per_day}
                          onChange={(e) => handleUpdateRow(idx, 'hours_per_day', parseFloat(e.target.value) || 24)}
                          className="w-14 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={row.environment}
                          onChange={(e) => handleUpdateRow(idx, 'environment', e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500"
                        >
                          <option value="Production">Production</option>
                          <option value="Staging">Staging</option>
                          <option value="Development">Development</option>
                          <option value="Test">Test</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={row.status}
                          onChange={(e) => handleUpdateRow(idx, 'status', e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500"
                        >
                          <option value="running">Running</option>
                          <option value="idle">Idle</option>
                          <option value="stopped">Stopped</option>
                          <option value="unattached">Unattached</option>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleRemoveRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                          title="Remove Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setMode('view')}>
                Cancel
              </Button>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-500">
                  Total Monthly Cost: <strong className="text-slate-900 font-bold">{formatAmount(resources.reduce((acc, r) => acc + (parseFloat(r.monthly_cost) || 0), 0))}</strong>
                </span>
                <Button
                  variant="primary"
                  size="md"
                  icon={Sparkles}
                  onClick={() => runAnalysis(resources)}
                  className="font-bold shadow-md"
                >
                  Analyze Savings Opportunities
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* MODE: EMPTY STATE (NO DATA SUBMITTED YET) */}
      {/* ========================================================= */}
      {mode === 'view' && (!analysisData || analysisData.opportunities_count === 0) && (
        <Card className="py-16 text-center border-dashed border-2 border-slate-300">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto text-brand-600 border border-brand-200 shadow-sm">
              <PiggyBank className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">No Cloud Cost Data Analyzed Yet</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                To generate evidence-based, personalized FinOps recommendations, add your cloud resources or upload a CSV file with your monthly costs and utilization telemetry.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  if (resources.length === 0) handleAddResourceRow();
                  setMode('form');
                }}
                className="w-full sm:w-auto"
              >
                Add Resource Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={UploadCloud}
                onClick={() => setMode('csv')}
                className="w-full sm:w-auto"
              >
                Upload CSV File
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Sparkles}
                onClick={handleLoadSampleData}
                className="w-full sm:w-auto"
              >
                Load Sample Dataset
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* MODE: ACTIVE SAVINGS ANALYSIS DASHBOARD & ACTION CARDS */}
      {/* ========================================================= */}
      {mode === 'view' && analysisData && analysisData.opportunities_count > 0 && (
        <>
          {/* Top Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-50 border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase block">Current Monthly Spend</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatAmount(analysisData.total_monthly_spend)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Based on {analysisData.resource_count} analyzed resources</p>
            </Card>

            <Card className="bg-emerald-50/60 border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase block">Estimated Potential Savings</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                +{formatAmount(analysisData.potential_monthly_savings)}
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                {analysisData.overall_savings_percentage}% Total Cost Reduction
              </p>
            </Card>

            <Card className="bg-emerald-50/60 border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase block">Estimated Annual Savings</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                +{formatAmount(analysisData.potential_annual_savings)}/yr
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">Direct annualized ROI</p>
            </Card>

            <Card className="bg-brand-50/60 border-brand-200">
              <span className="text-xs font-bold text-brand-800 uppercase block">Optimized Run-Rate</span>
              <div className="text-2xl font-extrabold text-brand-900 mt-1">
                {formatAmount(analysisData.estimated_optimized_spend)}
              </div>
              <p className="text-[11px] text-brand-600 mt-1">Target monthly spend post-action</p>
            </Card>
          </div>

          {/* Dynamic Impact Simulation Slider */}
          <ImpactSimulationSlider
            baseMonthlySpend={analysisData.total_monthly_spend}
            maxMonthlySavings={analysisData.potential_monthly_savings}
          />

          {/* Strategic Pillar Category Breakdown */}
          <Card title="Savings Breakdown by FinOps Pillar" subtitle="Distribution of identified efficiency opportunities">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Compute Rightsizing</span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  +{formatAmount(analysisData.savings_by_category?.rightsizing || 0)}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Downsize low CPU/Memory nodes</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Idle Resource Cleanup</span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  +{formatAmount(analysisData.savings_by_category?.idle_termination || 0)}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Teardown unattached/stopped items</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Schedule Optimization</span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  +{formatAmount(analysisData.savings_by_category?.scheduling || 0)}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Auto-stop non-prod environments</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Storage Lifecycle</span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  +{formatAmount(analysisData.savings_by_category?.storage_tiering || 0)}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">S3/Blob Intelligent Tiering</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Savings Plans</span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  +{formatAmount(analysisData.savings_by_category?.commitments || 0)}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">1-Yr commitments on steady compute</p>
              </div>
            </div>
          </Card>

          {/* Filter & Sort Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-2 flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1" /> Category:
              </span>
              {[
                { id: 'all', label: 'All Opportunities' },
                { id: 'rightsizing', label: 'Rightsizing' },
                { id: 'idle_termination', label: 'Idle Cleanup' },
                { id: 'scheduling', label: 'Scheduling' },
                { id: 'storage_tiering', label: 'Storage' },
                { id: 'commitments', label: 'Commitments' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    categoryFilter === cat.id
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1" /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
              >
                <option value="savings_desc">Highest Savings</option>
                <option value="risk_asc">Lowest Risk</option>
                <option value="effort_asc">Quick Wins (Low Effort)</option>
                <option value="confidence_desc">Highest Confidence</option>
              </select>
            </div>
          </div>

          {/* Actionable Recommendation Cards Grid */}
          <div className="space-y-4">
            {filteredOpportunities.length === 0 ? (
              <Card className="py-8 text-center text-xs text-slate-400">
                No recommendations match the selected category filter.
              </Card>
            ) : (
              filteredOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:shadow-md transition-all space-y-4"
                >
                  {/* Card Header & Savings Capsule */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Badge variant="primary" size="sm">
                          {opp.category_label}
                        </Badge>
                        <Badge
                          variant={opp.risk_level === 'Low' ? 'success' : opp.risk_level === 'Medium' ? 'warning' : 'critical'}
                          size="sm"
                          dot
                        >
                          {opp.risk_level} Risk
                        </Badge>
                        <Badge variant="default" size="sm">
                          {opp.effort_level} Effort
                        </Badge>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {opp.confidence_level} Confidence ({Math.round(opp.confidence_score * 100)}%)
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900">{opp.title}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {opp.provider_code?.toUpperCase()} • {opp.service_name} • <span className="font-mono font-semibold">{opp.resource_id}</span>
                      </div>
                    </div>

                    {/* Savings Capsule */}
                    <div className="sm:text-right bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex-shrink-0">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Estimated Saving</span>
                      <div className="text-lg font-extrabold text-emerald-700">
                        +{formatAmount(opp.estimated_monthly_savings)}
                        <span className="text-xs font-semibold ml-1">/mo</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 block">
                        +{formatAmount(opp.estimated_annual_savings)}/yr ({opp.savings_percent}%)
                      </span>
                    </div>
                  </div>

                  {/* Section: Why */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Why Optimize This Resource?
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {opp.why}
                    </p>
                  </div>

                  {/* Section: Evidence Grid */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Submitted Telemetry Evidence
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {Object.entries(opp.evidence || {}).map(([key, val]) => (
                        <div key={key} className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                          <span className="text-[10px] font-semibold text-slate-400 block uppercase">{key}</span>
                          <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate" title={String(val)}>
                            {String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section: Suggested Action Callout */}
                  <div className="p-3.5 bg-brand-50/60 rounded-xl border border-brand-200 flex items-start space-x-2.5">
                    <Zap className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-brand-900 block">Suggested Implementation Step:</span>
                      <p className="text-xs text-brand-800 mt-0.5 leading-relaxed">{opp.suggested_action}</p>
                    </div>
                  </div>

                  {/* Contextual Risk & Effort Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                    <div className="flex items-start space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Risk Evaluation:</strong> {opp.risk_reason}</span>
                    </div>
                    <div className="flex items-start space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Effort Evaluation:</strong> {opp.effort_reason}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SavingsEstimationPage;
