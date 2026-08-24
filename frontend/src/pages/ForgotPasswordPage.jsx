import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setSubmitted(true); // show generic success message for security
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-card">
      <div className="mb-6">
        <Link
          to="/login"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to login
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reset Password</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      {submitted ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Check your inbox</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 max-w-xs mx-auto">
            If an account exists for <span className="font-semibold text-slate-700">{email}</span>, we have sent a secure password recovery link.
          </p>
          <Link to="/login">
            <Button variant="primary" size="md" className="w-full">
              Return to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Registered Work Email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            icon={ArrowRight}
            className="w-full font-bold shadow-sm mt-2"
          >
            Send Reset Instructions
          </Button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
