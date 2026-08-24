import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 75, label: 'Good', color: 'bg-indigo-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the Terms of Service to continue.');
      return;
    }

    setLoading(true);
    const res = await register(email, password, fullName, 'Admin');
    setLoading(false);

    if (res.success) {
      // Flow: Register -> Onboarding -> Dashboard
      navigate('/onboarding');
    } else {
      setError(res.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-card">
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-brand-600 font-bold text-xs uppercase tracking-wider mb-1.5">
          <Sparkles className="w-4 h-4" />
          <span>Get Started</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create your Account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Deploy AI-driven FinOps intelligence across your multi-cloud estate.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium animate-in fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          name="fullName"
          placeholder="Sarah Connor"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          icon={User}
          required
        />

        <Input
          label="Work Email"
          type="email"
          name="email"
          placeholder="sarah@enterprise.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
          required
        />

        <div>
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            required
          />

          {password && (
            <div className="mt-2">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                <span>Password Strength</span>
                <span className="font-bold text-slate-700">{strength.label}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={Lock}
          required
        />

        <div className="flex items-start space-x-2 text-xs pt-1">
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4 mt-0.5"
            required
          />
          <label htmlFor="terms" className="text-slate-600 leading-tight">
            I agree to the{' '}
            <span className="text-brand-600 font-semibold cursor-pointer">Terms of Service</span> and{' '}
            <span className="text-brand-600 font-semibold cursor-pointer">Privacy Policy</span>.
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          icon={ArrowRight}
          className="w-full font-bold shadow-sm mt-2"
        >
          Create Workspace & Continue
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="text-brand-600 hover:text-brand-700 font-bold">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
