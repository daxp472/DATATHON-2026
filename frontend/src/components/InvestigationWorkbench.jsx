import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  Clock, 
  Smartphone, 
  MapPin, 
  ArrowRight, 
  Activity, 
  TrendingUp, 
  Users, 
  Cpu, 
  FileText, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Eye, 
  Server,
  KeyRound,
  History,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  CartesianGrid 
} from 'recharts';

const BACKEND_URL = 'http://localhost:5000';

export default function InvestigationWorkbench({ 
  transactions = [], 
  onSelectTransaction,
  initialTransactionId = null,
  initialCustomerId = 'CUST-1001'
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const [selectedTransactionId, setSelectedTransactionId] = useState(initialTransactionId || transactions[0]?.transactionId || '');
  const [customerProfile, setCustomerProfile] = useState(null);
  const [investigationData, setInvestigationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeRelatedTab, setActiveRelatedTab] = useState('sameCustomer'); // 'sameCustomer' | 'sameDevice' | 'sameLocation' | 'timeWindow'

  // Update selected transaction when transactions change or initial is passed
  useEffect(() => {
    if (initialTransactionId) {
      setSelectedTransactionId(initialTransactionId);
    } else if (!selectedTransactionId && transactions.length > 0) {
      setSelectedTransactionId(transactions[0].transactionId);
    }
  }, [initialTransactionId, transactions]);

  // Load Customer Profile
  useEffect(() => {
    if (!selectedCustomerId) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/customers/${selectedCustomerId}/profile`);
        if (res.ok) {
          const data = await res.json();
          setCustomerProfile(data);
        }
      } catch (err) {
        console.warn(`[Investigation] Failed to fetch customer profile: ${err.message}`);
      }
    };
    fetchProfile();
  }, [selectedCustomerId]);

  // Load Deep Investigation Data when selectedTransactionId changes
  useEffect(() => {
    if (!selectedTransactionId) return;
    const fetchInvestigation = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/investigation/${selectedTransactionId}`);
        if (res.ok) {
          const data = await res.json();
          setInvestigationData(data);
          if (data.targetTransaction?.customerId && data.targetTransaction.customerId !== selectedCustomerId) {
            setSelectedCustomerId(data.targetTransaction.customerId);
          }
        }
      } catch (err) {
        console.warn(`[Investigation] Failed to fetch investigation: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestigation();
  }, [selectedTransactionId]);

  const target = investigationData?.targetTransaction || transactions.find(t => t.transactionId === selectedTransactionId) || transactions[0];
  const profile = customerProfile || investigationData?.customerProfile;
  const pattern = target?.patternDetected?.detected ? target.patternDetected.primaryPattern : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. INVESTIGATION WORKBENCH HEADER & SELECTOR BAR */}
      <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                AI FRAUD &amp; RISK INVESTIGATION WORKBENCH
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                DEEP XAI ANALYSIS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlating Customer Baselines • Multi-Variate Deviations • Cross-Transaction Pattern Signatures
            </p>
          </div>
        </div>

        {/* Customer & Transaction Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Customer Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400">Account:</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                const firstTxn = transactions.find(t => t.customerId === e.target.value);
                if (firstTxn) setSelectedTransactionId(firstTxn.transactionId);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="CUST-1001">CUST-1001 (Aarav Sharma — ₹2.4k Avg)</option>
              <option value="CUST-1002">CUST-1002 (Priya Patel — ₹3.5k Avg)</option>
              <option value="CUST-1003">CUST-1003 (Rohan Mehta — ₹15k Avg)</option>
              <option value="CUST-DEMO-CORP">CUST-DEMO-CORP (Mainframe Treasury — ₹500k Avg)</option>
            </select>
          </div>

          {/* Transaction Quick Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400">Event:</span>
            <select
              value={selectedTransactionId}
              onChange={(e) => setSelectedTransactionId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 max-w-[200px]"
            >
              {transactions.slice(0, 20).map((t) => (
                <option key={t.transactionId} value={t.transactionId}>
                  {t.transactionId.slice(-10)} ({t.decision?.action || 'ALLOW'} • ₹{t.amount?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. ATTACK / FRAUD PATTERN DETECTION BANNER */}
      {pattern && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950 via-rose-900/60 to-surface border-2 border-rose-500/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-rose-600 text-white shadow-lg animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900 text-rose-200 border border-rose-700">
                  ⚠️ MULTI-TRANSACTION PATTERN DETECTED
                </span>
                <span className="text-xs font-mono font-bold text-white uppercase">
                  {pattern.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  CONFIDENCE: {Math.round(pattern.confidence * 100)}%
                </span>
              </div>
              <p className="text-sm font-semibold text-rose-100 mt-1">
                {pattern.description}
              </p>
              <p className="text-xs text-rose-300/90 mt-0.5">
                <strong className="text-white">Recommended Policy Mitigation:</strong> {pattern.mitigation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs shadow-md uppercase">
              {pattern.severity} SEVERITY
            </span>
          </div>
        </div>
      )}

      {/* 3. PRIMARY INVESTIGATION GRID: BASELINE vs OBSERVED DEVIATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Behavioral Baseline Profile */}
        <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Customer Behavioral Profile
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                (profile?.currentRiskStatus?.riskScore || 0) >= 76
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : (profile?.currentRiskStatus?.riskScore || 0) >= 36
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                RISK: {profile?.currentRiskStatus?.riskScore || 20}/100 [{profile?.currentRiskStatus?.riskLevel || 'LOW'}]
              </span>
            </div>

            {/* Profile Metrics Grid */}
            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Account Baseline Amount</span>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  ₹{profile?.baselineMetrics?.normalAmount?.toLocaleString() || '2,400'}
                  <span className="text-xs text-slate-400 font-normal ml-2">
                    (±₹{profile?.baselineMetrics?.standardDeviation?.toLocaleString() || '800'} σ)
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800/80">
                  <span>Min: ₹{profile?.baselineMetrics?.minAmount?.toLocaleString() || '450'}</span>
                  <span>Max: ₹{profile?.baselineMetrics?.maxAmount?.toLocaleString() || '52,000'}</span>
                </div>
              </div>

              {/* Usual Locations */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-400" /> Historical Usual Locations
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(profile?.behavioralPatterns?.usualLocations || []).slice(0, 3).map((loc, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                      {loc.name || loc} {loc.count ? `(${loc.count}x)` : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* Usual Devices */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono mb-1.5 flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-indigo-400" /> Registered Hardware Devices
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(profile?.behavioralPatterns?.usualDevices || []).slice(0, 3).map((dev, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                      {dev.name || dev} {dev.count ? `(${dev.count}x)` : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* 24-Hour Active Window Bar Histogram */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-purple-400" /> Active Hours Distribution (00-23h)
                </span>
                <div className="h-16 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(profile?.behavioralPatterns?.usualHours || Array(24).fill(0)).map((val, h) => ({ h, val }))}>
                      <Bar dataKey="val" fill="#818cf8" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-1">
                  <span>00:00 (Off-Peak)</span>
                  <span>14:00 (Peak Active)</span>
                  <span>23:00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-surface-border text-[11px] text-slate-400 flex items-center justify-between">
            <span>Recorded Activity: {profile?.baselineMetrics?.totalTransactionsRecorded || 0} events</span>
            <span className="text-emerald-400 font-semibold font-mono">Profile Verified</span>
          </div>
        </div>

        {/* Middle Column: Target Event & Specific Deviations Matrix */}
        <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Target Event &amp; Feature Deviations
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-slate-300">
                {target?.transactionId}
              </span>
            </div>

            {/* Target Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Observed Amount</span>
                <span className="text-lg font-bold font-mono text-white">
                  ₹{target?.amount?.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">AI Decision</span>
                <span className={`text-base font-bold font-mono ${
                  target?.decision?.action === 'BLOCK' ? 'text-rose-400' : target?.decision?.action === 'REVIEW' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {target?.decision?.action || 'ALLOW'} ({target?.riskResult?.riskScore || 0}/100)
                </span>
              </div>
            </div>

            {/* Detected Deviations List */}
            <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block font-mono">
                Multivariate Baseline Comparison:
              </span>
              {(investigationData?.detectedDeviations || []).map((dev, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{dev.feature}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      dev.severity === 'CRITICAL' 
                        ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                        : dev.severity === 'HIGH' 
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {dev.severity}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-slate-400">
                    <div>Baseline: <span className="text-slate-300">{dev.baseline}</span></div>
                    <div>Observed: <span className="text-white font-bold">{dev.observed}</span></div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug pt-1 font-sans">
                    {dev.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-surface-border text-xs text-slate-400">
            ML Execution Time: <span className="text-indigo-300 font-mono">{target?.performance?.mlLatencyMs || 0.25}ms</span>
          </div>
        </div>

        {/* Right Column: AI Reason Attribution & Autonomous Actions */}
        <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  XAI Reasons &amp; Action Dispatch
                </h3>
              </div>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                Vectorized XAI
              </span>
            </div>

            {/* Explainable AI Reasons */}
            <div className="mt-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block font-mono">
                Signal-Derived Reason Codes:
              </span>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {(target?.riskResult?.reasons || ['Behavioral signals conform to standard baseline.']).map((r, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-start gap-2">
                    <span className="text-indigo-400 font-mono font-bold">•</span>
                    <span className="leading-snug">{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Autonomous Action Checklist */}
            <div className="mt-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block font-mono">
                Autonomous Operational Playbook:
              </span>
              <div className="space-y-1.5">
                {(investigationData?.recommendedActions || [
                  'Authorize transaction automatically with zero friction.',
                  'Update customer rolling behavioral average and device trust index.'
                ]).map((actionText, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-snug">
                    {actionText}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-surface-border">
            <button
              onClick={() => onSelectTransaction && onSelectTransaction(target)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Eye className="w-4 h-4" />
              <span>Open Deep JSON &amp; Signal Inspector</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. CUSTOMER RISK TIMELINE & TRAJECTORY CHART */}
      <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Customer Risk Trajectory Timeline ({profile?.customerId})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Chronological risk score progression across transactions</span>
        </div>

        <div className="h-56 w-full">
          {(!profile?.riskTimeline || profile.riskTimeline.length === 0) ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
              No historical trajectory recorded for this customer.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profile.riskTimeline}>
                <defs>
                  <linearGradient id="invTimelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="transactionId" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(val) => val.slice(-6)} 
                />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  formatter={(val, name, item) => [
                    `${val}/100 [${item.payload.decision}] (₹${item.payload.amount?.toLocaleString()})`, 
                    'Risk Score'
                  ]}
                  labelFormatter={(val) => `Txn: ${val}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="riskScore" 
                  stroke="#6366f1" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#invTimelineGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 5. RELATED TRANSACTIONS MATRIX (Cross-Customer, Device Fingerprint, Geographic Cluster) */}
      <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Related Transactions Matrix (Fraud Ring &amp; Coordinated Anomaly Analysis)
            </h3>
          </div>

          {/* Related Tabs */}
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs font-mono">
            {[
              { id: 'sameCustomer', label: 'Same Customer' },
              { id: 'sameDevice', label: 'Same Device ID' },
              { id: 'sameLocation', label: 'Same Location' },
              { id: 'timeWindow', label: '±30m Temporal Window' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveRelatedTab(tab.id)}
                className={`px-3 py-1 rounded text-[11px] font-semibold transition-all ${
                  activeRelatedTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table of Related Transactions */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase border-b border-surface-border">
              <tr>
                <th className="py-2 px-3">Transaction ID</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Device / Location</th>
                <th className="py-2 px-3">Risk Score</th>
                <th className="py-2 px-3">Decision</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {(!investigationData?.relatedTransactions?.[activeRelatedTab] || investigationData.relatedTransactions[activeRelatedTab].length === 0) ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 italic font-sans">
                    No related transactions found in this cluster.
                  </td>
                </tr>
              ) : (
                investigationData.relatedTransactions[activeRelatedTab].map(t => (
                  <tr key={t.transactionId} className="hover:bg-slate-900/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-200">{t.transactionId}</td>
                    <td className="py-2.5 px-3 text-indigo-300">{t.customerId}</td>
                    <td className="py-2.5 px-3 font-bold text-white">₹{t.amount?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {t.device?.type || 'Standard'} • {t.location?.name || 'Domestic'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold ${
                        (t.riskResult?.riskScore || 0) >= 76 ? 'text-rose-400' : (t.riskResult?.riskScore || 0) >= 36 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {t.riskResult?.riskScore || 0}/100
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.decision?.action === 'BLOCK' ? 'bg-rose-950 text-rose-300 border border-rose-800' : t.decision?.action === 'REVIEW' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {t.decision?.action || 'ALLOW'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedTransactionId(t.transactionId)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-sans text-[11px] transition-colors"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
