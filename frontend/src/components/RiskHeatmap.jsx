import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  RefreshCw, 
  ShieldAlert, 
  Activity, 
  Filter, 
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area 
} from 'recharts';

const BACKEND_URL = 'http://localhost:5000';

export default function RiskHeatmap({ onSelectCustomer, onRefreshDashboard }) {
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeDimension, setActiveDimension] = useState('time'); // 'time' | 'location' | 'customer' | 'amount'

  const loadHeatmap = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/analytics/heatmap`);
      if (res.ok) {
        const data = await res.json();
        setHeatmapData(data);
      }
    } catch (err) {
      console.warn(`[RiskHeatmap] Failed to load heatmap data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeatmap();
  }, []);

  const getRiskColor = (score) => {
    if (score >= 76) return '#f43f5e'; // rose-500
    if (score >= 36) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. HEADER & DIMENSION SELECTOR */}
      <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                MULTI-DIMENSIONAL RISK HEATMAP &amp; ANALYTICS
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-purple-950 text-purple-300 border border-purple-800 font-semibold">
                REAL PERSISTED DATA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated Spatial, Temporal, Account, and Volume Risk Distributions
            </p>
          </div>
        </div>

        {/* Dimension Tabs & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs font-mono">
            {[
              { id: 'time', label: 'Time vs Risk', icon: Clock },
              { id: 'location', label: 'Location vs Risk', icon: MapPin },
              { id: 'customer', label: 'Customer vs Risk', icon: Users },
              { id: 'amount', label: 'Amount vs Risk', icon: DollarSign }
            ].map(dim => {
              const DimIcon = dim.icon;
              return (
                <button
                  key={dim.id}
                  onClick={() => setActiveDimension(dim.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-all ${
                    activeDimension === dim.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DimIcon className="w-3.5 h-3.5" />
                  <span>{dim.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={loadHeatmap}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Refresh Heatmap"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. MAIN ACTIVE DIMENSION VISUALIZATION */}
      <div className="bg-surface rounded-2xl p-6 border border-surface-border shadow-xl space-y-6">
        {/* TIME VS RISK (24-Hour Spatial Grid & Bar Intensity) */}
        {activeDimension === 'time' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    24-Hour Diurnal Risk &amp; Anomaly Distribution
                  </h3>
                  <p className="text-xs text-slate-400">Mean Risk Score (0-100) and Transaction Volume per Hour of Day</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                Hourly Aggregation
              </span>
            </div>

            {/* 24-Hour Visual Intensity Heatmap Blocks */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase font-mono block">24-Hour Risk Grid (Hourly Intensity):</span>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 font-mono text-[10px]">
                {(heatmapData?.timeVsRisk || []).map((h, i) => {
                  const score = h.avgRisk;
                  const intensityClass = 
                    score >= 76 ? 'bg-rose-950/80 border-rose-600 text-rose-300' :
                    score >= 50 ? 'bg-amber-950/80 border-amber-600 text-amber-300' :
                    score >= 30 ? 'bg-indigo-950/80 border-indigo-600 text-indigo-300' :
                    'bg-emerald-950/60 border-emerald-700 text-emerald-300';

                  return (
                    <div 
                      key={i} 
                      className={`p-2 rounded-xl border text-center flex flex-col justify-between transition-transform hover:scale-105 cursor-pointer ${intensityClass}`}
                      title={`Hour ${h.hour}: Mean Risk ${h.avgRisk}/100, Volume: ${h.count} events, Blocked: ${h.blocked}`}
                    >
                      <span className="text-[9px] text-slate-400">{h.hour}</span>
                      <span className="font-bold text-xs my-0.5">{h.avgRisk || 0}</span>
                      <span className="text-[8px] text-slate-400">{h.count} txns</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart View */}
            <div className="h-64 w-full pt-4 border-t border-surface-border/60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmapData?.timeVsRisk || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(val, name) => [`${val}/100`, 'Mean Risk Score']}
                  />
                  <Bar dataKey="avgRisk" radius={[4, 4, 0, 0]}>
                    {(heatmapData?.timeVsRisk || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getRiskColor(entry.avgRisk)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* LOCATION VS RISK */}
        {activeDimension === 'location' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Geographic Cluster Risk Exposure
                  </h3>
                  <p className="text-xs text-slate-400">Mean Risk Score and Total Volume Grouped by Geolocation</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={heatmapData?.locationVsRisk || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 100]} />
                    <YAxis dataKey="location" type="category" stroke="#64748b" fontSize={11} width={130} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                      formatter={(val) => [`${val}/100`, 'Average Risk Score']}
                    />
                    <Bar dataKey="avgRisk" radius={[0, 4, 4, 0]}>
                      {(heatmapData?.locationVsRisk || []).map((entry, index) => (
                        <Cell key={`cell-loc-${index}`} fill={getRiskColor(entry.avgRisk)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase border-b border-surface-border">
                    <tr>
                      <th className="py-2.5 px-3">Location Cluster</th>
                      <th className="py-2.5 px-3">Events</th>
                      <th className="py-2.5 px-3">Mean Risk</th>
                      <th className="py-2.5 px-3">Blocked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/60">
                    {(heatmapData?.locationVsRisk || []).map((loc, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="py-2.5 px-3 font-semibold text-white font-sans">{loc.location}</td>
                        <td className="py-2.5 px-3 text-slate-300">{loc.count}</td>
                        <td className="py-2.5 px-3 font-bold" style={{ color: getRiskColor(loc.avgRisk) }}>
                          {loc.avgRisk}/100
                        </td>
                        <td className="py-2.5 px-3 text-rose-400 font-bold">{loc.blocked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER VS RISK */}
        {activeDimension === 'customer' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Customer Risk Exposure Ranking
                  </h3>
                  <p className="text-xs text-slate-400">Mean vs Peak Risk Scores across Active Account Profiles</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {(heatmapData?.customerVsRisk || []).map((cust, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-white">{cust.customerId}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      cust.avgRisk >= 76 ? 'bg-rose-950 text-rose-300' : cust.avgRisk >= 36 ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      AVG: {cust.avgRisk}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Total Txns</span>
                      <span className="text-white font-bold">{cust.count}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Max Risk</span>
                      <span className="text-rose-400 font-bold">{cust.maxRisk}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Blocked</span>
                      <span className="text-rose-400 font-bold">{cust.blocked}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectCustomer && onSelectCustomer(cust.customerId)}
                    className="w-full py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-colors"
                  >
                    Open Investigation
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AMOUNT TIERS VS RISK */}
        {activeDimension === 'amount' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Transaction Value Bracket vs Risk Correlation
                  </h3>
                  <p className="text-xs text-slate-400">Mean Risk Score and Block Rate Segmented by Transaction Amount Tiers</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {(heatmapData?.amountVsRisk || []).map((tier, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Bracket</span>
                    <h4 className="font-bold text-white text-xs leading-snug">{tier.tier}</h4>
                    <div className="mt-3 text-2xl font-bold font-mono" style={{ color: getRiskColor(tier.avgRisk) }}>
                      {tier.avgRisk} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-800 flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Events: {tier.count}</span>
                    <span className="text-rose-400">Blocked: {tier.blocked}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
