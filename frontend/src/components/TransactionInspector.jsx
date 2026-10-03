import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Smartphone, 
  MapPin, 
  Zap, 
  Layers, 
  Cpu, 
  Database,
  ArrowRight,
  TrendingUp,
  KeyRound,
  FileText,
  Server,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function TransactionInspector({ transaction, onClose }) {
  const [activeTab, setActiveTab] = useState('riskFactors'); // 'riskFactors' | 'customerProfile' | 'rawJson'

  if (!transaction) return null;

  const {
    transactionId,
    customerId,
    amount,
    currency = 'INR',
    timestamp,
    channel,
    sourceSystem,
    platform,
    device = {},
    location = {},
    featuresExtracted = {},
    riskResult = {},
    decision = {},
    performance = {},
    metadata = {},
    patternDetected = {},
    isSimulation
  } = transaction;

  const riskScore = riskResult.riskScore ?? 0;
  const action = decision.action || 'ALLOW';
  const isIBMZ = sourceSystem === 'IBM_Z' || transaction.data_source === 'IBM_Z_SIMULATION';
  const pattern = patternDetected?.detected ? patternDetected.primaryPattern : null;

  const getActionTheme = (act) => {
    switch (act) {
      case 'ALLOW':
        return {
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          bg: 'border-emerald-500/40 bg-emerald-950/20',
          icon: ShieldCheck,
          text: 'text-emerald-400'
        };
      case 'REVIEW':
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          bg: 'border-amber-500/40 bg-amber-950/20',
          icon: AlertTriangle,
          text: 'text-amber-400'
        };
      case 'BLOCK':
      default:
        return {
          badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          bg: 'border-rose-500/40 bg-rose-950/20',
          icon: ShieldAlert,
          text: 'text-rose-400'
        };
    }
  };

  const theme = getActionTheme(action);
  const ActionIcon = theme.icon;

  // 7 Granular Anomaly Signals for "Why This Transaction Is Risky"
  const normalAvg = featuresExtracted.normalCustomerAvg || 2400;
  const amountRatio = normalAvg > 0 ? (amount / normalAvg) : 1;
  const hour = featuresExtracted.hourOfDay !== undefined ? featuresExtracted.hourOfDay : new Date(timestamp).getHours();
  const isOffPeak = hour >= 1 && hour <= 5;
  const velocity = featuresExtracted.transactionVelocity1h || 1;
  const failedAttempts = featuresExtracted.recentFailedAttempts || 0;

  const riskFactorsList = [
    {
      name: 'Amount Anomaly',
      observed: `₹${amount?.toLocaleString()} (${amountRatio.toFixed(1)}x baseline)`,
      baseline: `₹${normalAvg.toLocaleString()}`,
      contributionPct: Math.min(100, Math.round(amountRatio * 15)),
      isAnomaly: amountRatio >= 2.5,
      severity: amountRatio >= 10 ? 'CRITICAL' : amountRatio >= 2.5 ? 'HIGH' : 'NORMAL',
      desc: amountRatio >= 2.5 ? `Transaction amount is ${amountRatio.toFixed(1)}x greater than baseline average.` : 'Amount conforms to expected customer range.'
    },
    {
      name: 'Device Anomaly',
      observed: device.isNew ? 'Unrecognized / Novel Hardware' : (device.type || 'Known Hardware'),
      baseline: 'Known Hardware Fingerprint',
      contributionPct: device.isNew ? 75 : 10,
      isAnomaly: Boolean(device.isNew),
      severity: device.isNew ? 'HIGH' : 'NORMAL',
      desc: device.isNew ? 'Device ID / user-agent has not previously been associated with this account.' : 'Hardware matches verified profile.'
    },
    {
      name: 'Location Anomaly',
      observed: location.isUnusual ? `${location.name || 'Overseas'} (Foreign Cluster)` : (location.name || 'Primary Domestic'),
      baseline: 'Primary Domestic Geolocation',
      contributionPct: location.isUnusual ? 80 : 10,
      isAnomaly: Boolean(location.isUnusual),
      severity: location.isUnusual ? 'HIGH' : 'NORMAL',
      desc: location.isUnusual ? 'Transaction coordinates outside historical geographic perimeter.' : 'Geolocation conforms to domestic profile.'
    },
    {
      name: 'Temporal Anomaly',
      observed: `${String(hour).padStart(2, '0')}:00 hrs ${isOffPeak ? '(Off-Peak)' : '(Active)'}`,
      baseline: '08:00 — 22:00 Active Daytime',
      contributionPct: isOffPeak ? 65 : 15,
      isAnomaly: isOffPeak,
      severity: isOffPeak ? 'MEDIUM' : 'NORMAL',
      desc: isOffPeak ? 'Transaction initiated during unusual off-peak hours (01:00-05:00 AM).' : 'Initiated during regular active window.'
    },
    {
      name: 'Velocity Anomaly',
      observed: `${velocity} transactions in past 1 hr`,
      baseline: '≤ 2 transactions / hr',
      contributionPct: Math.min(100, velocity * 15),
      isAnomaly: velocity >= 4,
      severity: velocity >= 6 ? 'CRITICAL' : velocity >= 4 ? 'HIGH' : 'NORMAL',
      desc: velocity >= 4 ? `High-frequency burst: ${velocity} transactions in 1-hour window.` : 'Velocity within normal frequency.'
    },
    {
      name: 'Failed-Attempt Anomaly',
      observed: `${failedAttempts} failed login/OTP attempts`,
      baseline: '0 failures',
      contributionPct: Math.min(100, failedAttempts * 30),
      isAnomaly: failedAttempts > 0,
      severity: failedAttempts >= 3 ? 'CRITICAL' : failedAttempts > 0 ? 'HIGH' : 'NORMAL',
      desc: failedAttempts > 0 ? `${failedAttempts} consecutive failed auth attempts prior to transaction.` : 'Zero prior failed attempts.'
    },
    {
      name: 'Behavioral Deviation (Mahalanobis Distance)',
      observed: `Anomaly Score: ${(riskResult.anomalyScore * 100).toFixed(1)}%`,
      baseline: 'Multivariate Centroid',
      contributionPct: Math.round(riskResult.anomalyScore * 100),
      isAnomaly: riskResult.isAnomaly,
      severity: riskResult.anomalyScore >= 0.7 ? 'CRITICAL' : riskResult.anomalyScore >= 0.5 ? 'HIGH' : 'NORMAL',
      desc: 'Vectorized Isolation Forest path-length deviation across all orthogonal feature dimensions.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border border-surface-border rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200 flex flex-col justify-between max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-card/60">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${theme.badge}`}>
              <ActionIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white font-mono">{transactionId}</h3>
                {isIBMZ && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                    <Server className="w-3 h-3 text-blue-400" />
                    IBM Z / zOS
                  </span>
                )}
                {isSimulation && (
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-amber-950 text-amber-400 border border-amber-800">
                    DEMO DATA
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Customer: <span className="font-semibold text-slate-200">{customerId}</span> • Ingested: {new Date(timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Attack Pattern Detection Banner */}
          {pattern && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/80 shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-600 text-white">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      ⚠️ PATTERN DETECTED: {pattern.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-900 text-rose-200 border border-rose-700">
                      CONFIDENCE: {Math.round(pattern.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-rose-200 mt-0.5 leading-snug">
                    {pattern.description}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white text-[10px] font-bold uppercase font-mono">
                {pattern.severity}
              </span>
            </div>
          )}

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Amount Card */}
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">Transaction Amount</span>
              <div className="mt-2 text-2xl font-bold font-mono text-white">
                {currency} {amount?.toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-surface-border/50 pt-2 font-mono">
                <span>Baseline Average:</span>
                <span className="text-slate-200">{currency} {normalAvg.toLocaleString()}</span>
              </div>
            </div>

            {/* Risk Score Card */}
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">AI Risk Score</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold font-mono ${riskScore >= 76 ? 'text-rose-400' : riskScore >= 36 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {riskScore}
                </span>
                <span className="text-sm font-mono text-slate-400">/ 100</span>
                <span className={`ml-auto px-2 py-0.5 rounded text-xs font-bold font-mono ${riskScore >= 76 ? 'bg-rose-950 text-rose-300' : riskScore >= 36 ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'}`}>
                  {riskResult.riskLevel || 'LOW'}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-surface-border/50 pt-2 font-mono">
                <span>Anomaly Probability:</span>
                <span className="text-indigo-300">{(riskResult.anomalyScore * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Decision Action Card */}
            <div className={`p-4 rounded-xl border ${theme.bg} flex flex-col justify-between`}>
              <span className="text-xs text-slate-400 font-medium">Decision Engine Action</span>
              <div className={`mt-2 text-2xl font-bold font-mono ${theme.text}`}>
                {action}
              </div>
              <div className="mt-2 text-xs text-slate-300 border-t border-surface-border/50 pt-2">
                {decision.recommendation}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('riskFactors')}
              className={`flex-1 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'riskFactors' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Why This Transaction Is Risky (7 Anomalies)
            </button>
            <button
              onClick={() => setActiveTab('customerProfile')}
              className={`flex-1 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'customerProfile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Customer Behavioral Profile
            </button>
            <button
              onClick={() => setActiveTab('rawJson')}
              className={`flex-1 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'rawJson' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Canonical Payload JSON
            </button>
          </div>

          {/* TAB 1: WHY THIS TRANSACTION IS RISKY (7 Granular Anomaly Signals) */}
          {activeTab === 'riskFactors' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Granular Anomaly Breakdown &amp; Feature Importance
                </h4>

                <div className="space-y-3">
                  {riskFactorsList.map((factor, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{factor.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                            factor.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            factor.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            factor.severity === 'MEDIUM' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                            'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {factor.severity}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          Weight: <strong className="text-indigo-300">{factor.contributionPct}%</strong>
                        </span>
                      </div>

                      {/* Contribution Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          style={{ width: `${factor.contributionPct}%` }}
                          className={`h-full ${
                            factor.severity === 'CRITICAL' ? 'bg-rose-500' :
                            factor.severity === 'HIGH' ? 'bg-amber-500' :
                            factor.severity === 'MEDIUM' ? 'bg-purple-500' :
                            'bg-emerald-500'
                          }`}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                        <span>Baseline: {factor.baseline}</span>
                        <span className="text-slate-200">Observed: {factor.observed}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {factor.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explainable AI Reasons */}
              <div className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <FileText className="w-4 h-4 text-purple-400" /> Explainable AI (XAI) Signal Explanations
                </h4>
                <div className="space-y-1.5">
                  {(riskResult.reasons || ['Behavior conforms to normal baseline.']).map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span className="leading-relaxed">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMER BEHAVIORAL PROFILE */}
          {activeTab === 'customerProfile' && (
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-4 font-mono text-xs">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> Customer Behavioral Baseline &amp; Profile ({customerId})
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Baseline Average Amount</span>
                  <span className="text-white font-bold text-sm">₹{normalAvg.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">1h Rolling Velocity</span>
                  <span className="text-white font-bold text-sm">{velocity} txns/hr</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 font-sans text-xs">
                <span className="text-slate-400 font-mono text-[10px] uppercase block">Hardware &amp; Geolocation Verification</span>
                <div className="flex justify-between py-1 border-b border-slate-800 font-mono text-[11px]">
                  <span className="text-slate-400">Device Hardware:</span>
                  <span className={device.isNew ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {device.type || 'Standard'} ({device.isNew ? 'UNSEEN / NOVEL' : 'KNOWN'})
                  </span>
                </div>
                <div className="flex justify-between py-1 font-mono text-[11px]">
                  <span className="text-slate-400">Transaction Location:</span>
                  <span className={location.isUnusual ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {location.name || 'Domestic'} ({location.isUnusual ? 'UNUSUAL DISPLACEMENT' : 'MATCHES PROFILE'})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RAW JSON */}
          {activeTab === 'rawJson' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-surface-border">
              <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[300px] leading-relaxed">
                {JSON.stringify(transaction, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-card/60 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">
            Pipeline Latency: <strong className="text-white">{performance?.totalPipelineLatencyMs || 5}ms</strong> (ML: <strong className="text-indigo-300">{performance?.mlLatencyMs || 0.25}ms</strong>)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
