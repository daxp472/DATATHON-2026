import React, { useState } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Search, 
  Filter, 
  Radio, 
  Eye, 
  Zap, 
  Clock, 
  Smartphone, 
  MapPin, 
  ArrowUpRight,
  TrendingUp,
  X,
  FileText,
  Server,
  Layers,
  CheckCircle2,
  Cpu,
  Download,
  Sparkles,
  HelpCircle,
  History,
  Play
} from 'lucide-react';
import RiskAnalyticsCharts from './RiskAnalyticsCharts';

const BACKEND_URL = 'http://localhost:5000';

export default function LiveDashboard({ 
  transactions = [], 
  alerts = [], 
  stats = {}, 
  ibmZStatusData = null,
  onSelectTransaction,
  selectedTransaction,
  latestLiveAlert = null,
  onDismissAlert
}) {
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterRiskLevel, setFilterRiskLevel] = useState('ALL');
  const [filterCustomer, setFilterCustomer] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Demo Runner & Audit Viewer State
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStage, setDemoStage] = useState('');
  const [showAuditViewer, setShowAuditViewer] = useState(false);
  const [exportNotification, setExportNotification] = useState(null);

  const handleRunFullDemo = async () => {
    setDemoRunning(true);
    setDemoStage('Initiating 5-Stage Datathon Demo Pipeline...');
    try {
      setDemoStage('1/5 Ingesting Normal Customer Baseline Activity (ALLOW)...');
      const res = await fetch(`${BACKEND_URL}/api/simulation/full-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMs: 800, customerId: 'CUST-1001' })
      });
      const data = await res.json();
      setDemoStage('5/5 Sequence Completed! Live alerts and telemetry updated.');
      setTimeout(() => {
        setDemoRunning(false);
        setDemoStage('');
      }, 3500);
    } catch (err) {
      setDemoStage(`Demo execution error: ${err.message}`);
      setTimeout(() => setDemoRunning(false), 4000);
    }
  };

  const handleExport = (format) => {
    const url = `${BACKEND_URL}/api/transactions/export?format=${format}&limit=1000`;
    window.open(url, '_blank');
    setExportNotification(`Transactions exported successfully in ${format.toUpperCase()} format.`);
    setTimeout(() => setExportNotification(null), 4000);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    if (filterAction !== 'ALL' && t.decision?.action !== filterAction) return false;
    if (filterRiskLevel !== 'ALL' && t.riskResult?.riskLevel !== filterRiskLevel) return false;
    if (filterCustomer !== 'ALL' && t.customerId !== filterCustomer) return false;
    if (filterSource !== 'ALL') {
      if (filterSource === 'IBM_Z' && !t.sourceSystem?.includes('IBM_Z') && !t.data_source?.includes('IBM_Z')) return false;
      if (filterSource === 'STANDARD_SIM' && (t.sourceSystem?.includes('IBM_Z') || t.data_source?.includes('IBM_Z'))) return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchId = t.transactionId?.toLowerCase().includes(q);
      const matchCust = t.customerId?.toLowerCase().includes(q);
      const matchLoc = t.location?.name?.toLowerCase().includes(q);
      const matchDev = t.device?.type?.toLowerCase().includes(q);
      const matchSrc = t.sourceSystem?.toLowerCase().includes(q);
      if (!matchId && !matchCust && !matchLoc && !matchDev && !matchSrc) return false;
    }
    return true;
  });

  const getSourceBadge = (t) => {
    const isIBMZ = t.sourceSystem === 'IBM_Z' || t.data_source === 'IBM_Z_SIMULATION';
    if (isIBMZ) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-800 flex items-center gap-1">
          <Server className="w-2.5 h-2.5 text-blue-400" />
          IBM Z / zOS
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-800">
        SIMULATOR
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 0. NOTIFICATIONS & FULL DEMO BANNER */}
      {exportNotification && (
        <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{exportNotification}</span>
          </div>
          <button onClick={() => setExportNotification(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ONE-CLICK 5-MINUTE DATATHON DEMO RUNNER BAR */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/60 to-surface rounded-2xl p-4 border border-indigo-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/30 animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                🎬 ONE-CLICK 5-STAGE DATATHON LIVE DEMO SEQUENCE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                E2E PIPELINE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {demoRunning ? (
                <span className="text-amber-300 font-mono font-bold animate-pulse">{demoStage}</span>
              ) : (
                'Executes: Normal Activity → Velocity Spike → Multi-Signal Attack → IBM Z CICS Ingestion → Security Block'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleRunFullDemo}
            disabled={demoRunning}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg ${
              demoRunning
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-[1.02]'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{demoRunning ? 'Running Sequence...' : 'START 1-CLICK DEMO'}</span>
          </button>

          <button
            onClick={() => setShowAuditViewer(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
            title="Open Decision Engine Audit & Processing Log"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>Audit Log</span>
          </button>
        </div>
      </div>

      {/* 1. REAL-TIME CRITICAL ALERT FLASH BANNER */}
      {latestLiveAlert && (
        <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500/80 shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
                  🚨 REAL-TIME CRITICAL INTERVENTION DETECTED
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900 text-rose-200 border border-rose-700">
                  SCORE: {latestLiveAlert.riskScore}/100 [BLOCK]
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">
                Transaction <span className="font-mono">{latestLiveAlert.transactionId}</span> for {latestLiveAlert.customerId} (₹{latestLiveAlert.amount?.toLocaleString()})
              </p>
              <p className="text-xs text-rose-200/90">
                {latestLiveAlert.reasons?.[0] || 'Multi-signal anomaly triggered immediate operational block.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const matchTxn = transactions.find(t => t.transactionId === latestLiveAlert.transactionId);
                if (matchTxn) onSelectTransaction(matchTxn);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-lg"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect Anomaly</span>
            </button>

            {onDismissAlert && (
              <button
                onClick={onDismissAlert}
                className="p-1 rounded-lg text-rose-300 hover:text-white transition-colors"
                title="Dismiss Banner"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. EXECUTIVE METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Processed */}
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Volume</span>
            <div className="mt-1 text-2xl font-bold font-mono text-white">
              {stats?.totalTransactions ?? transactions.length}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Stream Events</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Autonomous Approval Rate */}
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Autonomous ALLOW</span>
            <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">
              {stats?.decisions?.allow ?? 0}
            </div>
            <span className="text-[10px] text-emerald-400/80 font-mono">
              {stats?.allowRatePct ?? 85}% Rate
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Step-Up Review Rate */}
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Step-Up REVIEW</span>
            <div className="mt-1 text-2xl font-bold font-mono text-amber-400">
              {stats?.decisions?.review ?? 0}
            </div>
            <span className="text-[10px] text-amber-400/80 font-mono">MFA / Hold</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Critical Interventions */}
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Immediate BLOCK</span>
            <div className="mt-1 text-2xl font-bold font-mono text-rose-400">
              {stats?.decisions?.block ?? 0}
            </div>
            <span className="text-[10px] text-rose-400/80 font-mono">
              {stats?.blockRatePct ?? 0}% Prevented
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Mean AI Risk Score */}
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-lg flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <span className="text-xs text-slate-400 font-medium">Mean AI Risk</span>
            <div className="mt-1 text-2xl font-bold font-mono text-indigo-400">
              {stats?.averageRiskScore ?? 28} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Model Calibrated</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. ENTERPRISE IBM Z / zOS STATUS BANNER */}
      <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-surface to-blue-950/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Enterprise Source: IBM Z / z/OS Mainframe Adapter
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                {ibmZStatusData?.status || 'DEMONSTRATION_MODE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Normalization: <span className="font-mono text-slate-300">CICS/IMS Enterprise Ingest → Canonical Model → Python ML → Sub-second Decisioning</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
          <div>
            <span className="text-slate-500 block text-[10px]">Events Ingested:</span>
            <span className="text-white font-bold">{ibmZStatusData?.telemetry?.eventsReceived || 0}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Idempotency:</span>
            <span className="text-emerald-400 font-bold">ACTIVE</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Protocols:</span>
            <span className="text-blue-300">z/OS REST / MQ / CICS</span>
          </div>
        </div>
      </div>

      {/* 4. REAL-TIME CHARTS & DECISION ANALYTICS */}
      <RiskAnalyticsCharts stats={stats} transactions={transactions} />

      {/* 5. MAIN COMMAND CENTER GRID: STREAM TABLE & LIVE ALERTS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Transaction Stream */}
        <div className="lg:col-span-2 bg-surface rounded-2xl p-5 border border-surface-border shadow-lg flex flex-col justify-between">
          <div>
            {/* Header & Comprehensive Filter Bar */}
            <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-surface-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Real-Time Decision Stream ({filteredTransactions.length} of {transactions.length})
                  </h3>
                </div>

                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-900">
                  Sub-second Push Active
                </span>
              </div>

              {/* Filter Controls Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {/* Decision Filters */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase mr-1">Decision:</span>
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
                    {['ALL', 'ALLOW', 'REVIEW', 'BLOCK'].map((act) => (
                      <button
                        key={act}
                        onClick={() => setFilterAction(act)}
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold transition-all ${
                          filterAction === act ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase mr-1">Source:</span>
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
                    {[
                      { id: 'ALL', label: 'ALL' },
                      { id: 'IBM_Z', label: 'IBM Z' },
                      { id: 'STANDARD_SIM', label: 'SIM' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setFilterSource(s.id)}
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold transition-all ${
                          filterSource === s.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-[11px] text-slate-300 font-semibold transition-colors"
                    title="Export filtered transactions as CSV spreadsheet"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-[11px] text-slate-300 font-semibold transition-colors"
                    title="Export filtered transactions as JSON records"
                  >
                    <Download className="w-3 h-3 text-indigo-400" />
                    <span>JSON</span>
                  </button>
                </div>

                {/* Customer Filter */}
                <div className="flex items-center gap-1">
                  <select
                    value={filterCustomer}
                    onChange={(e) => setFilterCustomer(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Customers</option>
                    <option value="CUST-1001">CUST-1001 (Aarav)</option>
                    <option value="CUST-1002">CUST-1002 (Priya)</option>
                    <option value="CUST-1003">CUST-1003 (Rohan)</option>
                    <option value="CUST-DEMO-CORP">CUST-DEMO-CORP (Z-OS)</option>
                  </select>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search ID, customer, loc..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-2.5 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-36"
                  />
                </div>
              </div>
            </div>

            {/* Stream Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-mono text-[10px] uppercase border-b border-surface-border">
                  <tr>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Transaction ID</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Signals</th>
                    <th className="py-2.5 px-3">Risk Score</th>
                    <th className="py-2.5 px-3">Decision</th>
                    <th className="py-2.5 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/60 font-mono">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-500 italic">
                        No transactions match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.slice(0, 15).map((t) => (
                      <tr
                        key={t.transactionId}
                        onClick={() => onSelectTransaction(t)}
                        className={`hover:bg-surface-card/90 transition-colors cursor-pointer ${
                          selectedTransaction?.transactionId === t.transactionId ? 'bg-indigo-950/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">
                          {t.transactionId?.slice(-12)}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          {getSourceBadge(t)}
                        </td>
                        <td className="py-2.5 px-3 text-indigo-300">
                          {t.customerId}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white font-mono">
                          ₹{t.amount?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-300 text-[11px]">
                          <div className="flex items-center gap-1">
                            {t.device?.isNew && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-950/90 text-amber-400 text-[9px] font-mono border border-amber-800" title="New Device">
                                DEV
                              </span>
                            )}
                            {t.location?.isUnusual && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-950/90 text-rose-400 text-[9px] font-mono border border-rose-800" title="Geographic Anomaly">
                                LOC
                              </span>
                            )}
                            {t.featuresExtracted?.recentFailedAttempts > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-pink-950/90 text-pink-400 text-[9px] font-mono border border-pink-800" title="Failed Logins">
                                AUTH
                              </span>
                            )}
                            {!t.device?.isNew && !t.location?.isUnusual && !t.featuresExtracted?.recentFailedAttempts && (
                              <span className="text-slate-500 text-[10px]">Normal</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold font-mono ${
                              (t.riskResult?.riskScore || 0) >= 76 
                                ? 'text-rose-400' 
                                : (t.riskResult?.riskScore || 0) >= 36 
                                ? 'text-amber-400' 
                                : 'text-emerald-400'
                            }`}>
                              {t.riskResult?.riskScore || 0}
                            </span>
                            <div className="w-10 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                              <div 
                                style={{ width: `${t.riskResult?.riskScore || 0}%` }}
                                className={`h-full ${
                                  (t.riskResult?.riskScore || 0) >= 76 
                                    ? 'bg-rose-500' 
                                    : (t.riskResult?.riskScore || 0) >= 36 
                                    ? 'bg-amber-500' 
                                    : 'bg-emerald-500'
                                }`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.decision?.action === 'BLOCK'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : t.decision?.action === 'REVIEW'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {t.decision?.action || 'ALLOW'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTransaction(t);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300"
                            title="Open deep inspection modal"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-surface-border text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Live Socket.io Telemetry
            </span>
            <span>Total buffered: {transactions.length} events</span>
          </div>
        </div>

        {/* Right 1 Col: Live Critical Alerts Panel */}
        <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Critical Anomaly Alerts ({alerts.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase bg-rose-950 text-rose-400 px-2 py-0.5 rounded border border-rose-800 font-bold">
                AUTO-ESCALATED
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs italic">
                  No active critical risk alerts. Baseline is secure.
                </div>
              ) : (
                alerts.slice(0, 8).map((alert, idx) => (
                  <div
                    key={alert.alertId || idx}
                    onClick={() => {
                      const matchTxn = transactions.find(t => t.transactionId === alert.transactionId);
                      if (matchTxn) onSelectTransaction(matchTxn);
                    }}
                    className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 hover:border-rose-500/70 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-rose-300">
                        {alert.transactionId}
                      </span>
                      <span className="text-[10px] font-mono text-rose-300 font-bold bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800">
                        RISK: {alert.riskScore}/100
                      </span>
                    </div>

                    <div className="text-xs text-white font-mono font-bold">
                      ₹{alert.amount?.toLocaleString()} • <span className="text-slate-300">{alert.customerId}</span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                      {alert.reasons?.[0] || 'Multi-signal anomaly triggered immediate operational block.'}
                    </p>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-rose-900/40">
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      <span className="text-rose-400 font-bold flex items-center gap-1 group-hover:underline">
                        Inspect <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-surface-border text-[11px] text-slate-400">
            Autonomous decision engine recommendations delivered in sub-second SLA.
          </div>
        </div>
      </div>

      {/* 6. AUDIT & EVENT LOG VIEWER MODAL */}
      {showAuditViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Autonomous Decision Engine Audit &amp; Event Log
                  </h3>
                </div>
                <button 
                  onClick={() => setShowAuditViewer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 overflow-y-auto max-h-[480px] space-y-2 pr-1 font-mono text-xs">
                {transactions.slice(0, 30).map((t, idx) => (
                  <div key={t.transactionId || idx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[10px]">{new Date(t.timestamp).toISOString()}</span>
                        <span className="font-bold text-white">{t.transactionId}</span>
                        <span className="text-indigo-300">[{t.customerId}]</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          t.decision?.action === 'BLOCK' ? 'bg-rose-950 text-rose-300' : t.decision?.action === 'REVIEW' ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                        }`}>
                          {t.decision?.action}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans">
                        {t.riskResult?.reasons?.[0] || 'Behavioral parameters conform to normal baseline.'}
                      </p>
                    </div>
                    <div className="text-right text-[11px]">
                      <span className="text-white font-bold block">₹{t.amount?.toLocaleString()}</span>
                      <span className="text-slate-400">Score: {t.riskResult?.riskScore}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border flex items-center justify-between">
              <span className="text-xs text-slate-400">Total logged stream events: {transactions.length}</span>
              <button
                onClick={() => setShowAuditViewer(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Close Audit Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

