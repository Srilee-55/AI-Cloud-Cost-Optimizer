import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('demo@cloudoptimizer.ai');
  const [password, setPassword] = useState('OptimizerDemo2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Invalid credentials. Please check your details and try again.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-card">
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-brand-600 font-bold text-xs uppercase tracking-wider mb-1.5">
          <Sparkles className="w-4 h-4" />
          <span>FinOps Portal</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
        <p className="text-xs text-slate-500 mt-1">
          Sign in to access your multi-cloud optimization cockpit.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium animate-in fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Work Email"
          type="email"
          name="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
          required
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
            <span className="text-slate-600 font-medium">Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-brand-600 hover:text-brand-700 font-semibold"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          icon={ArrowRight}
          className="w-full font-bold shadow-sm mt-2"
        >
          Sign In to Workspace
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-600 hover:text-brand-700 font-bold">
          Create an account
        </Link>
      </div>

      <div className="mt-4 p-3 bg-brand-50/60 rounded-xl border border-brand-100 text-[11px] text-brand-800">
        <span className="font-bold">Demo Workspace Credentials:</span>
        <div className="mt-0.5 font-mono text-[10.5px]">demo@cloudoptimizer.ai / OptimizerDemo2026!</div>
      </div>
    </div>
  );
};

export default LoginPage;
