import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles
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

const ReportsPage = () => {
  const { activeWorkspace } = useAuth();
  const { showToast } = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [reportTitle, setReportTitle] = useState('Monthly FinOps Executive Summary');
  const [reportType, setReportType] = useState('executive_summary');
  const [fileFormat, setFileFormat] = useState('pdf');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports');
      if (res.data?.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeWorkspace]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/reports/generate', {
        title: reportTitle,
        report_type: reportType,
        file_format: fileFormat,
        include_anomalies: true,
        include_forecasts: true,
        include_recommendations: true,
      });

      if (res.data?.success) {
        showToast(`${fileFormat.toUpperCase()} report generated successfully!`, 'success');
        setModalOpen(false);
        await fetchReports();
      }
    } catch (err) {
      showToast('Report generation failed.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (reportId, format) => {
    window.open(`/api/reports/${reportId}/download`, '_blank');
    showToast('Download started.', 'info');
  };

  const columns = [
    {
      header: 'Report Title',
      accessor: (row) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-brand-50 text-brand-600 border border-brand-100">
            {row.file_format === 'pdf' ? <FileText className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-slate-900">{row.title}</div>
            <div className="text-[11px] text-slate-400">{row.report_type?.replace('_', ' ').toUpperCase()}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Format',
      accessor: (row) => (
        <Badge variant={row.file_format === 'pdf' ? 'danger' : 'success'} size="sm">
          {row.file_format?.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Generation Date',
      accessor: (row) => (
        <span className="text-xs text-slate-600">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Ready
        </span>
      ),
    },
    {
      header: 'Download',
      align: 'right',
      accessor: (row) => (
        <Button
          variant="outline"
          size="xs"
          icon={Download}
          onClick={() => handleDownload(row.id, row.file_format)}
          className="font-semibold shadow-sm"
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Executive Reports & Exports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate presentation-ready PDF executive summaries or raw cost records in CSV format.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setModalOpen(true)}
          className="shadow-sm font-bold"
        >
          Generate New Report
        </Button>
      </div>

      {/* Reports Table */}
      <Table
        columns={columns}
        data={reports}
        isLoading={loading}
        emptyMessage="No reports generated yet. Click 'Generate New Report' to create one."
      />

      {/* Generate Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Generate Cloud Cost Report"
        subtitle="Compile current multi-cloud findings into exportable format"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={generating}
              onClick={handleGenerate}
            >
              Generate Report
            </Button>
          </>
        }
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <Input
            label="Report Title"
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            required
          />

          <Select
            label="Report Template"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={[
              { value: 'executive_summary', label: 'Executive Financial Summary & Recommendations' },
              { value: 'anomaly_audit', label: 'Anomaly Detection & Spike Audit' },
              { value: 'monthly_cost', label: 'Complete Multi-Cloud Records Export' },
            ]}
          />

          <Select
            label="Export Format"
            value={fileFormat}
            onChange={(e) => setFileFormat(e.target.value)}
            options={[
              { value: 'pdf', label: 'Adobe PDF Document (.pdf)' },
              { value: 'csv', label: 'Comma-Separated Values (.csv)' },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
};

export default ReportsPage;
