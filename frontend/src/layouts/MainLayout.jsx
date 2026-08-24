import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Cloud,
  Layers,
  UploadCloud,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  PiggyBank,
  Sparkles,
  Bot,
  Bell,
  FileText,
  PieChart,
  ShieldCheck,
  ClipboardList,
  Settings,
  Users,
  LogOut,
  ChevronDown,
  Menu,
  X,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import api from '../services/api';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const MainLayout = () => {
  const { user, activeWorkspace, workspaces, switchWorkspace, logout } = useAuth();
  const { currency, setCurrency, currencies } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);

  // Fetch unread alerts count
  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await api.get('/alerts');
        if (res.data?.success && res.data.data) {
          const unread = res.data.data.filter((a) => !a.is_read).length;
          setUnreadAlertsCount(unread);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 45000);
    return () => clearInterval(interval);
  }, []);

  const navSections = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Cloud Management',
      items: [
        { label: 'Cloud Accounts', path: '/cloud/accounts', icon: Cloud },
        { label: 'Cost Ingestion', path: '/cloud/data', icon: UploadCloud },
      ],
    },
    {
      title: 'Cost Intelligence',
      items: [
        { label: 'Cost Analysis', path: '/analysis', icon: BarChart3 },
        { label: 'Anomaly Detection', path: '/anomalies', icon: AlertTriangle, badge: unreadAlertsCount > 0 ? `${unreadAlertsCount}` : null },
        { label: 'Cost Forecasting', path: '/forecast', icon: TrendingUp },
        { label: 'Savings Estimation', path: '/savings', icon: PiggyBank },
      ],
    },
    {
      title: 'Agentic AI',
      items: [
        { label: 'AI Optimization', path: '/ai/optimization', icon: Sparkles, highlight: true },
        { label: 'AI Copilot', path: '/ai/copilot', icon: Bot },
      ],
    },
    {
      title: 'Monitoring & Insights',
      items: [
        { label: 'Alerts & Events', path: '/alerts', icon: Bell },
        { label: 'Analytics Hub', path: '/analytics', icon: PieChart },
        { label: 'Reports & Export', path: '/reports', icon: FileText },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Security & RBAC', path: '/security', icon: ShieldCheck },
        { label: 'Audit Logs', path: '/audit', icon: ClipboardList },
        { label: 'Settings', path: '/settings', icon: Settings },
        ...(user?.role === 'Admin' || user?.is_superuser
          ? [{ label: 'Admin Panel', path: '/admin', icon: Users }]
          : []),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-subtle h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm font-bold text-base">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                AI Cloud Cost Optimizer
              </span>
            </div>
          </Link>

          {/* Workspace Switcher */}
          <div className="relative ml-4">
            <button
              onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
              className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="max-w-[140px] truncate">{activeWorkspace?.name || 'Workspace'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {wsDropdownOpen && (
              <div
                className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-elevated border border-slate-200 py-1 z-50 animate-in fade-in"
                onClick={() => setWsDropdownOpen(false)}
              >
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Switch Workspace
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => switchWorkspace(ws.id)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      ws.id === activeWorkspace?.id ? 'text-brand-600 font-semibold bg-brand-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {ws.is_demo && <Badge variant="warning" size="sm">Demo</Badge>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Header Utilities */}
        <div className="flex items-center space-x-2.5">
          {/* Currency Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs font-semibold">
            {currencies.map((c) => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`px-2 py-1 rounded-md transition-all ${
                  currency === c.code
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {c.symbol} {c.code}
              </button>
            ))}
          </div>

          {/* AI Copilot Quick Action */}
          <Button
            variant="outline"
            size="sm"
            icon={Bot}
            onClick={() => navigate('/ai/copilot')}
            className="hidden sm:inline-flex border-brand-200 text-brand-700 bg-brand-50/30 hover:bg-brand-50"
          >
            Copilot
          </Button>

          {/* Notifications Bell */}
          <Link
            to="/alerts"
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </Link>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs border border-brand-200">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {userDropdownOpen && (
              <div
                className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-elevated border border-slate-200 py-1 z-50 animate-in fade-in"
                onClick={() => setUserDropdownOpen(false)}
              >
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                  <div className="mt-1">
                    <Badge variant="primary" size="sm">{user?.role || 'Admin'}</Badge>
                  </div>
                </div>

                <Link
                  to="/settings"
                  className="flex items-center px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2 text-slate-400" />
                  Account Settings
                </Link>

                <button
                  onClick={logout}
                  className="w-full flex items-center px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full'
          }`}
        >
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {navSections.map((section, sIdx) => (
              <div key={sIdx}>
                <div className="px-2 mb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </div>
                <nav className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 font-bold border border-brand-100'
                            : item.highlight
                            ? 'text-brand-600 bg-brand-50/40 hover:bg-brand-50 hover:text-brand-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon
                            className={`w-4 h-4 ${
                              isActive
                                ? 'text-brand-600'
                                : item.highlight
                                ? 'text-brand-600'
                                : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            {item.badge}
                          </span>
                        )}
                        {item.highlight && !item.badge && (
                          <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse-subtle" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Agentic Engine</span>
              <span className="inline-flex items-center text-emerald-600 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                Active
              </span>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/30 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
