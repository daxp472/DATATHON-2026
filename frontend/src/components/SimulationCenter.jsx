import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  Send, 
  Layers, 
  Database, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Cpu, 
  Radio, 
  Sliders, 
  Zap, 
  Eye, 
  CheckCircle2, 
  Clock, 
  BarChart3,
  Server,
  ArrowRight,
  Workflow
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000';

export default function SimulationCenter({ 
  onSelectTransaction, 
  recentTransactions = [], 
  healthData,
  ibmZStatusData,
  onRefreshDashboard 
}) {
  const [selectedScenario, setSelectedScenario] = useState('normal');
  const [selectedCustomer, setSelectedCustomer] = useState('CUST-1001');
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeScenarioTrigger, setActiveScenarioTrigger] = useState(null);

  // Custom Transaction State
  const [customTxn, setCustomTxn] = useState({
    customerId: 'CUST-1001',
    amount: 87500,
    isNewDevice: true,
    isUnusualLocation: true,
    hourOfDay: 3,
    transactionVelocity1h: 5,
    recentFailedAttempts: 2,
    location: 'Bucharest, Romania',
    channel: 'ONLINE_BANKING'
  });

  // Batch Simulation State
  const [batchConfig, setBatchConfig] = useState({
    scenario: 'mixed',
    count: 10,
    intervalMs: 150
  });
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchSummary, setBatchSummary] = useState(null);

  // Stream Simulation State
  const [streamRunning, setStreamRunning] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStage, setDemoStage] = useState('');


  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // 0. Run Full 5-Stage Datathon Demo Sequence
  const handleRunFullDemo = async () => {
    setDemoRunning(true);
    setDemoStage('Starting 5-stage Datathon Live Demo Sequence...');
    try {
      setDemoStage('Injecting Baseline Normal → Spike → Multi-Signal Attack → IBM Z CICS → Security Block...');
      const res = await fetch(`${BACKEND_URL}/api/simulation/full-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMs: 800, customerId: selectedCustomer })
      });
      const data = await res.json();
      showNotification('5-Stage Datathon Demo Sequence completed successfully! Stream updated.', 'success');
      setDemoStage('Sequence finished successfully! All 5 stages executed.');
      if (onRefreshDashboard) onRefreshDashboard();
      setTimeout(() => {
        setDemoRunning(false);
        setDemoStage('');
      }, 3000);
    } catch (err) {
      showNotification(`Demo sequence failed: ${err.message}`, 'error');
      setDemoRunning(false);
      setDemoStage('');
    }
  };


  // 1. Run Predefined Quick Scenario
  const handleRunScenario = async (scenarioId) => {
    setActiveScenarioTrigger(scenarioId);
    setIsExecuting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/simulation/scenario/${scenarioId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selectedCustomer })
      });
      const data = await res.json();
      showNotification(`Scenario '${scenarioId}' executed: [${data.decision?.action}] Risk Score ${data.riskResult?.riskScore}/100`, 'success');
      onSelectTransaction(data);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      showNotification(`Failed to execute scenario: ${err.message}`, 'error');
    } finally {
      setIsExecuting(false);
      setActiveScenarioTrigger(null);
    }
  };

  // 2. Run IBM Z Enterprise Scenarios
  const handleRunIBMZScenario = async (scenarioKey) => {
    setActiveScenarioTrigger(`ibm-z-${scenarioKey}`);
    setIsExecuting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/integrations/ibm-z/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioKey, customerId: 'CUST-DEMO-CORP' })
      });
      const data = await res.json();
      showNotification(`IBM Z Enterprise Event processed: [${data.decision?.action}] Risk Score ${data.riskResult?.riskScore}/100`, 'success');
      onSelectTransaction(data);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      showNotification(`IBM Z simulation failed: ${err.message}`, 'error');
    } finally {
      setIsExecuting(false);
      setActiveScenarioTrigger(null);
    }
  };

  // 3. Send Custom Transaction
  const handleSendCustom = async (e) => {
    e.preventDefault();
    setIsExecuting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/simulation/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customTxn)
      });
      const data = await res.json();
      showNotification(`Custom transaction processed: [${data.decision?.action}] Risk Score ${data.riskResult?.riskScore}/100`, 'success');
      onSelectTransaction(data);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      showNotification(`Custom transaction failed: ${err.message}`, 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  // 4. Run Batch Simulation
  const handleRunBatch = async () => {
    setBatchRunning(true);
    setBatchSummary(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/simulation/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: batchConfig.scenario,
          count: parseInt(batchConfig.count, 10),
          interval_ms: parseInt(batchConfig.intervalMs, 10),
          customerId: selectedCustomer
        })
      });
      const data = await res.json();
      setBatchSummary(data.summary);
      showNotification(`Batch completed! Processed ${data.summary.processed} transactions.`, 'success');
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      showNotification(`Batch simulation failed: ${err.message}`, 'error');
    } finally {
      setBatchRunning(false);
    }
  };

  // 5. Stream Simulation Controls
  const handleToggleStream = async () => {
    if (streamRunning) {
      try {
        await fetch(`${BACKEND_URL}/api/simulation/stream/stop`, { method: 'POST' });
        setStreamRunning(false);
        showNotification('Stream simulation stopped.', 'info');
      } catch (err) {
        showNotification(err.message, 'error');
      }
    } else {
      try {
        await fetch(`${BACKEND_URL}/api/simulation/stream/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count: 30, interval_ms: 1000, anomaly_ratio: 0.3, customerId: selectedCustomer })
        });
        setStreamRunning(true);
        showNotification('Continuous stream simulation started (30 events, 1s interval)...', 'success');
      } catch (err) {
        showNotification(err.message, 'error');
      }
    }
  };

  // 6. Seed Test Data
  const handleSeedData = async () => {
    setSeedLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/simulation/seed`, { method: 'POST' });
      const data = await res.json();
      showNotification(`Baseline history seeded: ${data.data.seededCustomers} customers, ${data.data.seededHistoricalTransactions} historical records.`, 'success');
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      showNotification(`Seeding failed: ${err.message}`, 'error');
    } finally {
      setSeedLoading(false);
    }
  };

  // 7. Reset Simulation Data
  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to purge all simulation records from MongoDB?')) return;
    setResetLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/simulation/reset`, { method: 'DELETE' });
      const data = await res.json();
      showNotification(`Reset complete: ${data.data.transactionsDeleted} demo transactions purged.`, 'info');
      setBatchSummary(null);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      showNotification(`Reset failed: ${err.message}`, 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const scenariosList = [
    {
      id: 'normal',
      name: '1. Normal Transaction',
      desc: 'Amount ~ ₹2,400, known device & location, normal daytime.',
      expected: 'ALLOW',
      color: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/10'
    },
    {
      id: 'high-amount',
      name: '2. High Amount Spike',
      desc: 'Amount 22x above normal baseline (₹52,800+), known device.',
      expected: 'REVIEW / BLOCK',
      color: 'border-amber-500/30 hover:border-amber-500/60 bg-amber-950/10'
    },
    {
      id: 'new-device',
      name: '3. New Device Novelty',
      desc: 'Unrecognized device identifier & browser user-agent.',
      expected: 'REVIEW',
      color: 'border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-950/10'
    },
    {
      id: 'unusual-location',
      name: '4. Unusual Location',
      desc: 'Foreign/Unfamiliar location IP (Bucharest, Romania).',
      expected: 'REVIEW / BLOCK',
      color: 'border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-950/10'
    },
    {
      id: 'unusual-time',
      name: '5. Unusual Time (03:17 AM)',
      desc: 'Off-peak early morning anomaly outside active window.',
      expected: 'REVIEW',
      color: 'border-purple-500/30 hover:border-purple-500/60 bg-purple-950/10'
    },
    {
      id: 'high-velocity',
      name: '6. High Velocity Burst',
      desc: '8 transactions initiated within rolling 1-hour window.',
      expected: 'REVIEW / BLOCK',
      color: 'border-orange-500/30 hover:border-orange-500/60 bg-orange-950/10'
    },
    {
      id: 'failed-attempts',
      name: '7. Prior Failed Attempts',
      desc: '3 consecutive failed authentication & OTP attempts.',
      expected: 'REVIEW / BLOCK',
      color: 'border-pink-500/30 hover:border-pink-500/60 bg-pink-950/10'
    },
    {
      id: 'behavior-change',
      name: '8. Sudden Behavior Drift',
      desc: 'Jumps from ₹2,400 to ₹72,000 + new device + new location.',
      expected: 'BLOCK',
      color: 'border-rose-500/30 hover:border-rose-500/60 bg-rose-950/10'
    },
    {
      id: 'multi-signal',
      name: '9. Multi-Signal Attack',
      desc: '₹87,500 + New Device + Unusual Loc + 03:17 AM + Velocity + Failures.',
      expected: 'BLOCK (90-100)',
      color: 'border-rose-500/50 hover:border-rose-500 bg-rose-950/20'
    }
  ];

  const ibmZScenarios = [
    {
      id: 'normal',
      name: 'IBM Z Normal CICS Transaction',
      desc: 'CWIR transaction ₹45,000 via IBM-Z16-CICS-GW01 (Baseline: ₹500,000).',
      expected: 'ALLOW',
      color: 'border-blue-500/40 hover:border-blue-500/70 bg-blue-950/20'
    },
    {
      id: 'anomaly',
      name: 'IBM Z Settlement Anomaly',
      desc: 'CSET batch wire ₹4,800,000 (9.6x baseline) via Frankfurt bridge.',
      expected: 'REVIEW / BLOCK',
      color: 'border-amber-500/40 hover:border-amber-500/70 bg-amber-950/20'
    },
    {
      id: 'attack',
      name: 'IBM Z Mainframe Attack',
      desc: 'CADM unmapped TN3270 terminal, off-peak 03:00 AM, 4 RACF failures.',
      expected: 'BLOCK (Score 100)',
      color: 'border-rose-500/50 hover:border-rose-500 bg-rose-950/30'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300' 
            : notification.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-300'
            : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Mode & Architecture Status Header */}
      <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                SIMULATION &amp; TESTING ENGINE
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-amber-950 text-amber-400 border border-amber-800 font-semibold">
                ● DEMO / SIMULATION MODE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              All generated test transactions strictly flow through: <span className="text-indigo-300 font-mono">Backend Gateway → Feature Extractor → Python ML Engine → Decision Engine → MongoDB → Socket.io</span>
            </p>
          </div>
        </div>

        {/* Action Buttons: Seed & Reset */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleSeedData}
            disabled={seedLoading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all disabled:opacity-50"
            title="Populate test customers with realistic historical transaction baselines"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{seedLoading ? 'Seeding...' : 'Seed Baseline History'}</span>
          </button>

          <button
            onClick={handleResetData}
            disabled={resetLoading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all disabled:opacity-50"
            title="Safely purge all demo/simulation data from MongoDB"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{resetLoading ? 'Purging...' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </div>

      {/* DEDICATED 1-CLICK 5-STAGE FULL LIVE DEMO RUNNER */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-surface rounded-2xl p-5 border border-indigo-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/30 animate-pulse">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                🎬 COMPLETE 5-STAGE DATATHON LIVE DEMO SEQUENCE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                1-CLICK FULL RUN
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {demoRunning ? (
                <span className="text-amber-300 font-mono font-bold animate-pulse">{demoStage}</span>
              ) : (
                'Automatically runs through: 1. Normal Baseline (ALLOW) → 2. High Amount Spike (REVIEW) → 3. Multi-Signal Outlier Attack (BLOCK) → 4. IBM Z CICS Ingestion (ALLOW) → 5. IBM Z RACF Exploit (BLOCK).'
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleRunFullDemo}
          disabled={demoRunning}
          className={`px-5 py-3 rounded-xl font-bold text-xs transition-all shadow-xl flex items-center justify-center gap-2 ${
            demoRunning 
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-[1.03]'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{demoRunning ? 'Running 5-Stage Demo...' : 'RUN FULL DEMO SEQUENCE'}</span>
        </button>
      </div>

      {/* SECTION 1: ENTERPRISE IBM Z / zOS MAINFRAME SCENARIOS */}

      <div className="p-5 rounded-2xl bg-gradient-to-r from-surface to-blue-950/20 border border-blue-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
              IBM Z / z/OS Enterprise Mainframe Simulator (Real-Time CICS/IMS Ingestion)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
            Source: IBM_Z_SIMULATION
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ibmZScenarios.map((sc) => (
            <div
              key={sc.id}
              onClick={() => handleRunIBMZScenario(sc.id)}
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${sc.color} ${
                activeScenarioTrigger === `ibm-z-${sc.id}` ? 'ring-2 ring-blue-400 scale-[0.98]' : 'hover:scale-[1.01]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-white text-xs">{sc.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    sc.expected.includes('BLOCK') ? 'bg-rose-950 text-rose-300' : sc.expected.includes('REVIEW') ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {sc.expected}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  {sc.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-blue-900/40 flex items-center justify-between text-[10px] text-blue-300 font-mono">
                <span>Inject CICS Event</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Customer Selector */}
      <div className="bg-surface rounded-xl p-4 border border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="font-semibold text-white">Target Simulation Customer:</span>
          <select
            value={selectedCustomer}
            onChange={(e) => {
              setSelectedCustomer(e.target.value);
              setCustomTxn(prev => ({ ...prev, customerId: e.target.value }));
            }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
          >
            <option value="CUST-1001">CUST-1001 (Aarav Sharma — Baseline: ₹2,400)</option>
            <option value="CUST-1002">CUST-1002 (Priya Patel — Baseline: ₹3,500)</option>
            <option value="CUST-1003">CUST-1003 (Rohan Mehta — Baseline: ₹15,000)</option>
            <option value="CUST-DEMO-CORP">CUST-DEMO-CORP (Treasury Z-OS — Baseline: ₹500,000)</option>
          </select>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:block">
          Baseline metrics are dynamically pulled from MongoDB during feature extraction
        </span>
      </div>

      {/* SECTION 2: QUICK SCENARIO TRIGGER GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Standard Anomaly &amp; Attack Scenarios (1-Click Real Pipeline Execution)
          </h3>
          <span className="text-xs text-slate-400">Click any card to inject into live engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {scenariosList.map((sc) => (
            <div
              key={sc.id}
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${sc.color} ${
                activeScenarioTrigger === sc.id ? 'ring-2 ring-indigo-400 scale-[0.98]' : 'hover:scale-[1.01]'
              }`}
              onClick={() => handleRunScenario(sc.id)}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-white text-xs">{sc.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    sc.expected.includes('BLOCK') ? 'bg-rose-950 text-rose-300' : sc.expected.includes('REVIEW') ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {sc.expected}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  {sc.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-surface-border/40 flex items-center justify-between text-[10px] text-indigo-300 font-mono">
                <span>Inject Scenario</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: CUSTOM TRANSACTION BUILDER & BATCH / STREAM RUNNER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Transaction Builder */}
        <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4" /> Custom Transaction Generator
            </h3>

            <form onSubmit={handleSendCustom} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Customer ID</label>
                  <input
                    type="text"
                    value={customTxn.customerId}
                    onChange={(e) => setCustomTxn({ ...customTxn, customerId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Transaction Amount (INR)</label>
                  <input
                    type="number"
                    value={customTxn.amount}
                    onChange={(e) => setCustomTxn({ ...customTxn, amount: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Location Cluster</label>
                  <input
                    type="text"
                    value={customTxn.location}
                    onChange={(e) => setCustomTxn({ ...customTxn, location: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Hour of Day (0-23)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={customTxn.hourOfDay}
                    onChange={(e) => setCustomTxn({ ...customTxn, hourOfDay: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">1h Velocity (Txns/hr)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={customTxn.transactionVelocity1h}
                    onChange={(e) => setCustomTxn({ ...customTxn, transactionVelocity1h: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Recent Failed Auth Events</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={customTxn.recentFailedAttempts}
                    onChange={(e) => setCustomTxn({ ...customTxn, recentFailedAttempts: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={customTxn.isNewDevice}
                    onChange={(e) => setCustomTxn({ ...customTxn, isNewDevice: e.target.checked })}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>New / Unseen Device</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={customTxn.isUnusualLocation}
                    onChange={(e) => setCustomTxn({ ...customTxn, isUnusualLocation: e.target.checked })}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Unusual Location</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isExecuting}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isExecuting ? 'Processing via Real Pipeline...' : 'SEND CUSTOM TRANSACTION'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Batch & Continuous Stream Simulator */}
        <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Batch &amp; Real-Time Stream Simulation
            </h3>

            {/* Batch Configuration */}
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Scenario Type</label>
                  <select
                    value={batchConfig.scenario}
                    onChange={(e) => setBatchConfig({ ...batchConfig, scenario: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="mixed">Mixed (70% Normal, 30% Anomalies)</option>
                    <option value="normal">Normal Stream (All ALLOW)</option>
                    <option value="high-amount">High Amount Anomaly</option>
                    <option value="new-device">New Device Anomaly</option>
                    <option value="multi-signal">Multi-Signal Attack (All BLOCK)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Count (1-50)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={batchConfig.count}
                    onChange={(e) => setBatchConfig({ ...batchConfig, count: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Interval (ms)</label>
                  <input
                    type="number"
                    min="50"
                    max="2000"
                    step="50"
                    value={batchConfig.intervalMs}
                    onChange={(e) => setBatchConfig({ ...batchConfig, intervalMs: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRunBatch}
                  disabled={batchRunning}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>{batchRunning ? 'Running Batch Sequence...' : 'START BATCH SIMULATION'}</span>
                </button>

                <button
                  onClick={handleToggleStream}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    streamRunning 
                      ? 'bg-rose-600 text-white animate-pulse' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {streamRunning ? <Square className="w-3 h-3" /> : <Radio className="w-3 h-3 text-cyan-400" />}
                  <span>{streamRunning ? 'STOP STREAM' : 'LIVE STREAM'}</span>
                </button>
              </div>
            </div>

            {/* Batch Run Summary Results */}
            {batchSummary && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-purple-500/30 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Batch Execution Summary</span>
                  <span className="font-mono text-purple-400">{batchSummary.processed} / {batchSummary.totalRequested} Processed</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono py-1">
                  <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">ALLOW</span>
                    <span className="text-emerald-400 font-bold">{batchSummary.decisions.ALLOW}</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">REVIEW</span>
                    <span className="text-amber-400 font-bold">{batchSummary.decisions.REVIEW}</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">BLOCK</span>
                    <span className="text-rose-400 font-bold">{batchSummary.decisions.BLOCK}</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">AVG RISK</span>
                    <span className="text-indigo-400 font-bold">{batchSummary.averageRiskScore}</span>
                  </div>
                </div>

                {batchSummary.topDetectedFactors && batchSummary.topDetectedFactors.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 text-[11px]">
                    <span className="font-semibold text-slate-400">Top Detected Reasons:</span>
                    <ul className="mt-1 space-y-1 text-slate-300">
                      {batchSummary.topDetectedFactors.slice(0, 2).map((tf, i) => (
                        <li key={i} className="flex justify-between">
                          <span className="truncate max-w-[280px]">• {tf.factor}</span>
                          <span className="font-mono text-purple-300">×{tf.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: RECENT TEST STREAM TABLE */}
      <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Recent Simulated Events Stream ({recentTransactions.length})
          </h3>
          <span className="text-xs text-slate-400">Click row or 'Inspect' to see complete XAI feature breakdown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Device &amp; Location</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 italic">
                    No transactions generated yet. Run a scenario above to test the real AI pipeline.
                  </td>
                </tr>
              ) : (
                recentTransactions.slice(0, 10).map((t) => (
                  <tr 
                    key={t.transactionId}
                    onClick={() => onSelectTransaction(t)}
                    className="hover:bg-surface-card/80 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-200">
                      {t.transactionId}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {t.customerId}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">
                      ₹{t.amount?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className={t.device?.isNew ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                          {t.device?.isNew ? 'New Device' : 'Known'}
                        </span>
                        <span>•</span>
                        <span className={t.location?.isUnusual ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                          {t.location?.name || 'Domestic'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`font-mono font-bold ${
                        (t.riskResult?.riskScore || 0) >= 76 
                          ? 'text-rose-400' 
                          : (t.riskResult?.riskScore || 0) >= 36 
                          ? 'text-amber-400' 
                          : 'text-emerald-400'
                      }`}>
                        {t.riskResult?.riskScore || 0} / 100
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
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
                        title="View complete signal & XAI breakdown"
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
    </div>
  );
}
