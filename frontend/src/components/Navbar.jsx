import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  PlayCircle, 
  RefreshCw, 
  Radio, 
  Server, 
  HeartPulse, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Cpu, 
  Sparkles,
  HelpCircle,
  ShieldAlert,
  X
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  socketStatus, 
  healthData, 
  onRefreshHealth, 
  isRefreshing,
  ibmZStatus = 'DEMONSTRATION_MODE',
  onTriggerFullDemo,
  isDemoRunning = false
}) {
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const isAllHealthy = healthData?.status === 'HEALTHY';

  return (
    <>
      <header className="border-b border-surface-border bg-surface/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-white tracking-wide">
                  AI FRAUD &amp; RISK ENGINE
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                  DEMO / SIMULATION MODE
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase rounded bg-blue-950/80 text-blue-300 border border-blue-800">
                  <Server className="w-3 h-3 text-blue-400" />
                  IBM Z / zOS: {ibmZStatus === 'CONNECTED' ? 'CONNECTED' : 'DEMO MODE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Real-Time AI Decision Support • Sub-Second Anomaly Detection &amp; Autonomous Action
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-surface-border">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live Center</span>
            </button>

            <button
              onClick={() => setActiveTab('investigation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'investigation'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Investigation</span>
            </button>

            <button
              onClick={() => setActiveTab('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'heatmap'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>Risk Heatmap</span>
            </button>
            
            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'simulation'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulator</span>
            </button>
          </nav>


          {/* System Health, Quick Demo & Telemetry */}
          <div className="flex items-center gap-2.5">
            {/* Quick Demo Trigger Button */}
            {onTriggerFullDemo && (
              <button
                onClick={onTriggerFullDemo}
                disabled={isDemoRunning}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                  isDemoRunning 
                    ? 'bg-indigo-900 text-indigo-200 border border-indigo-700 animate-pulse' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                }`}
                title="Run complete 5-stage automated Datathon demo sequence"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isDemoRunning ? 'Running Demo...' : '🎬 Run Full Demo'}</span>
              </button>
            )}

            {/* Health Status Indicator & Modal Trigger */}
            <button
              onClick={() => setShowHealthModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
              title="View system microservices health status"
            >
              <HeartPulse className={`w-3.5 h-3.5 ${isAllHealthy ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
              <span className="hidden sm:inline font-mono text-[11px]">
                {isAllHealthy ? 'SYSTEM HEALTHY' : 'DEGRADED'}
              </span>
            </button>

            {/* Educational Help Modal Trigger */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="System Documentation & Decision Rules Reference"
            >
              <HelpCircle className="w-4 h-4 text-indigo-300" />
            </button>

            {/* WebSocket Telemetry */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
              <Radio className={`w-3 h-3 ${socketStatus === 'connected' ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
              <span className="text-slate-400 text-[11px]">Stream:</span>
              <span className={`text-[11px] font-mono ${socketStatus === 'connected' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}`}>
                {socketStatus === 'connected' ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefreshHealth}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Refresh System Health & Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* HEALTH STATUS MODAL */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Real-Time Microservices Health Status
                </h3>
              </div>
              <button 
                onClick={() => setShowHealthModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Backend Service */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Node.js API Gateway</span>
                    <span className="text-[10px] text-slate-400 font-mono">Port 5000 • Node {healthData?.components?.backend?.nodeVersion || 'v20+'}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {healthData?.components?.backend?.status || 'HEALTHY'}
                </span>
              </div>

              {/* Database */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">MongoDB Database</span>
                    <span className="text-[10px] text-slate-400 font-mono">Port 27017 • db: fraud_decision_engine</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {healthData?.components?.database?.status || 'HEALTHY'}
                </span>
              </div>

              {/* Python ML Service */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Python AI / ML Inference Service</span>
                    <span className="text-[10px] text-slate-400 font-mono">FastAPI • Port 8000 • Vectorized Isolation Forest</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {healthData?.components?.mlService?.status || 'HEALTHY'} ({healthData?.components?.mlService?.latencyMs || 1}ms)
                </span>
              </div>

              {/* Realtime Socket.io */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Real-Time WebSocket Stream</span>
                    <span className="text-[10px] text-slate-400 font-mono">Socket.io • Active Clients: {healthData?.components?.realtimeSockets?.activeClients || 1}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {healthData?.components?.realtimeSockets?.status || 'HEALTHY'}
                </span>
              </div>

              {/* IBM Z Demonstration Adapter */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">IBM Z / zOS Demo Adapter</span>
                    <span className="text-[10px] text-slate-400 font-mono">CICS / MQ / IMS Normalizer (Standalone Demo Mode)</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                  {healthData?.components?.ibmZDemoAdapter?.mode || 'ENTERPRISE_DEMO'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border text-center">
              <button
                onClick={() => setShowHealthModal(false)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Close Status Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDUCATIONAL HELP & RULES MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Datathon 2026 Engine Reference &amp; Decision Criteria
                </h3>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              {/* Risk Score Scale */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Risk Score Scale (0 to 100)
                </h4>
                <p className="text-slate-400">
                  Calibrated composite indicator fusing Machine Learning Anomaly Score, Multi-Variate Mahalanobis Distance, and Behavioral Risk Factor Weights:
                </p>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                  <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300">
                    <span className="font-bold block">0 – 35 (LOW RISK)</span>
                    <span className="text-[10px] text-emerald-400/80 font-sans">Autonomous Approval (ALLOW)</span>
                  </div>
                  <div className="p-2 rounded bg-amber-950/40 border border-amber-800 text-amber-300">
                    <span className="font-bold block">36 – 75 (MEDIUM RISK)</span>
                    <span className="text-[10px] text-amber-400/80 font-sans">Step-Up Verification (REVIEW)</span>
                  </div>
                  <div className="p-2 rounded bg-rose-950/40 border border-rose-800 text-rose-300">
                    <span className="font-bold block">76 – 100 (HIGH RISK)</span>
                    <span className="text-[10px] text-rose-400/80 font-sans">Immediate Prevention (BLOCK)</span>
                  </div>
                </div>
              </div>

              {/* Decision Rules */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-xs">Autonomous Decision Actions</h4>
                <ul className="space-y-1.5 text-slate-300">
                  <li><strong className="text-emerald-400">ALLOW (Green):</strong> Transaction parameters conform to customer historical behavior profile with low anomaly score. Settles automatically without customer friction.</li>
                  <li><strong className="text-amber-400">REVIEW (Yellow):</strong> Moderately elevated risk detected (novel device, unusual time, or moderate amount spike). Triggers step-up authentication (SMS/App OTP, Biometric verification) before fund release.</li>
                  <li><strong className="text-rose-400">BLOCK (Red):</strong> Severe anomaly detected (amount &gt; 10x baseline, unmapped emulator, geographic impossibility, consecutive failed auth attempts, or coordinated multi-signal attack). Transaction is rejected immediately and escalated to fraud ops.</li>
                </ul>
              </div>

              {/* IBM Z Integration Notice */}
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/60 space-y-1.5">
                <h4 className="font-bold text-blue-300 text-xs flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-blue-400" /> IBM Z / z/OS Mainframe Demonstration Mode
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Simulates enterprise core banking mainframe environments (CICS TS, IMS, MQSeries). Mainframe payloads with EBCDIC/Hex headers, Sysplex IDs, and RACF credentials are normalized through the canonical enterprise adapter with full idempotency deduplication before feeding into the real-time AI decision pipeline.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border text-center">
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

