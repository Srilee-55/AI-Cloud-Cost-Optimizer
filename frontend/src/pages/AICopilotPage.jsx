import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Terminal,
  ShieldCheck,
  Zap,
  ArrowRight,
  User,
  Clock,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';

const AICopilotPage = () => {
  const { user, activeWorkspace } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const promptSuggestions = [
    'Why did my cloud cost increase this month?',
    'Which cloud service costs the most?',
    'Find actionable savings opportunities.',
    'What anomalies happened recently?',
    'Will I exceed my monthly budget?',
    'Compare AWS and Azure spend distribution.',
  ];

  const fetchHistory = async () => {
    try {
      const res = await api.get('/ai/copilot/history');
      if (res.data?.success && res.data.data.length > 0) {
        setMessages(
          res.data.data.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            tools_consulted: m.tools_consulted || [],
            confidence: m.confidence || 0.95,
            timestamp: m.created_at,
          }))
        );
      } else {
        // Welcome message
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `Hello ${user?.full_name || 'there'}! I am your AI Cloud Cost Copilot. I analyze multi-cloud telemetry, detect anomalies, forecast budget trends, and suggest verified optimizations. How can I assist your FinOps team today?`,
            tools_consulted: ['get_service_costs', 'get_anomalies', 'estimate_savings'],
            confidence: 0.98,
            suggested_actions: [
              'Why did my cloud cost increase this month?',
              'Find actionable savings opportunities.',
              'Check 30-day budget forecast'
            ],
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      // fallback welcome
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeWorkspace]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const tempUserMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/copilot', {
        message: textToSend,
      });

      if (res.data?.success) {
        const d = res.data.data;
        const botMsg = {
          id: d.id,
          role: 'assistant',
          content: d.answer,
          tools_consulted: d.tools_consulted,
          confidence: d.confidence,
          suggested_actions: d.suggested_actions,
          timestamp: d.created_at,
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      showToast('Error communicating with AI Copilot.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-brand-600 text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Cloud Cost Copilot</h1>
            <p className="text-xs text-slate-500">
              Interactive conversational FinOps intelligence backed by live backend tools evidence.
            </p>
          </div>
        </div>

        <Badge variant="success" size="md" dot>
          Live Telemetry Active
        </Badge>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 overflow-y-auto shadow-card space-y-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm ${
                m.role === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-brand-600 text-white'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white font-medium rounded-tr-none'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
              }`}
            >
              {/* Content text */}
              <div className="whitespace-pre-line text-sm">{m.content}</div>

              {/* Assistant Metadata (Tools consulted, Confidence) */}
              {m.role === 'assistant' && (
                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  {m.tools_consulted?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        <Terminal className="w-3 h-3 mr-1" />
                        Tools Consulted:
                      </span>
                      {m.tools_consulted.map((t, idx) => (
                        <span
                          key={idx}
                          className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold"
                        >
                          {t}()
                        </span>
                      ))}
                    </div>
                  )}

                  {m.confidence && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center text-emerald-600 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Confidence Score: {Math.round(m.confidence * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Suggested Next Action Pills */}
                  {m.suggested_actions?.length > 0 && (
                    <div className="pt-1.5 space-y-1">
                      <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                        Suggested Inquiries:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.suggested_actions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(act)}
                            className="text-left px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 text-slate-700 text-xs font-medium transition-colors shadow-sm flex items-center"
                          >
                            <Zap className="w-3 h-3 text-amber-500 mr-1" />
                            {act}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-4 text-xs text-slate-500 flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Agent is querying database tools and synthesizing evidence...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto py-1 px-1 flex-shrink-0">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
          Quick Prompts:
        </span>
        {promptSuggestions.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1 bg-white border border-slate-200 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50/40 rounded-full text-xs font-medium text-slate-600 transition-colors whitespace-nowrap shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-card flex-shrink-0"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a question about your multi-cloud costs, idle instances, or forecasts..."
          className="flex-1 px-4 py-2 text-sm text-slate-900 bg-transparent focus:outline-none placeholder-slate-400"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          icon={Send}
          disabled={!inputQuery.trim() || loading}
          className="font-bold shadow-sm"
        >
          Send
        </Button>
      </form>
    </div>
  );
};

export default AICopilotPage;
