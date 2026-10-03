import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { TrendingUp, BarChart2, PieChart as PieIcon, ShieldAlert, Sparkles } from 'lucide-react';

export default function RiskAnalyticsCharts({ stats, transactions = [], analyticsData = null }) {
  // 1. Prepare Decision Distribution Data
  const allowCount = stats?.decisions?.allow || 0;
  const reviewCount = stats?.decisions?.review || 0;
  const blockCount = stats?.decisions?.block || 0;
  const totalDecisions = allowCount + reviewCount + blockCount || 1;

  const decisionData = [
    { name: 'ALLOW', count: allowCount, pct: Math.round((allowCount / totalDecisions) * 100), color: '#10B981' },
    { name: 'REVIEW', count: reviewCount, pct: Math.round((reviewCount / totalDecisions) * 100), color: '#F59E0B' },
    { name: 'BLOCK', count: blockCount, pct: Math.round((blockCount / totalDecisions) * 100), color: '#EF4444' }
  ];

  // 2. Prepare Risk Trajectory Data from MongoDB transactions stream
  const timelineData = [...transactions].reverse().slice(-25).map((t, idx) => ({
    idx: idx + 1,
    id: t.transactionId?.slice(-6) || `#${idx + 1}`,
    score: t.riskResult?.riskScore ?? 0,
    amount: t.amount,
    action: t.decision?.action || 'ALLOW',
    time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }));

  // 3. Prepare Real Risk Score Histogram Buckets (0-20, 21-40, 41-60, 61-80, 81-100)
  const scoreBuckets = [
    { range: '0-20 (Low)', count: 0, color: '#10B981' },
    { range: '21-40 (Low)', count: 0, color: '#34D399' },
    { range: '41-60 (Med)', count: 0, color: '#FBBF24' },
    { range: '61-80 (High)', count: 0, color: '#F87171' },
    { range: '81-100 (Crit)', count: 0, color: '#EF4444' }
  ];

  transactions.forEach((t) => {
    const s = t.riskResult?.riskScore ?? 0;
    if (s <= 20) scoreBuckets[0].count++;
    else if (s <= 40) scoreBuckets[1].count++;
    else if (s <= 60) scoreBuckets[2].count++;
    else if (s <= 80) scoreBuckets[3].count++;
    else scoreBuckets[4].count++;
  });

  // 4. Extract Top Detected Factors from actual transactions
  const factorMap = {};
  transactions.forEach(t => {
    (t.riskResult?.reasons || []).forEach(r => {
      // Shorten factor description for chart display
      let short = r;
      if (r.includes('significantly higher')) short = 'Amount Deviation (>10x)';
      else if (r.includes('noticeably elevated')) short = 'Amount Deviation (3x-10x)';
      else if (r.includes('Device has not previously')) short = 'New / Unseen Device';
      else if (r.includes('location')) short = 'Geographic Anomaly';
      else if (r.includes('unusual hour')) short = 'Temporal Anomaly (Off-peak)';
      else if (r.includes('failed attempt')) short = 'Prior Failed Logins';
      else if (r.includes('velocity')) short = 'High Velocity Burst';
      else if (r.includes('Compound Risk')) short = 'Compound Multi-Signal';
      else if (r.includes('conform')) short = 'Baseline Conforming';

      factorMap[short] = (factorMap[short] || 0) + 1;
    });
  });

  const topFactorsData = Object.entries(factorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([factor, count]) => ({ factor, count }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Real-Time Risk Score Trajectory Area Chart */}
      <div className="lg:col-span-2 bg-surface rounded-2xl p-5 border border-surface-border shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-surface-border/60">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Risk Score Trajectory &amp; Anomaly Peaks
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> ≤35 Allow</span>
              <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400"></span> 36-75 Review</span>
              <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400"></span> ≥76 Block</span>
            </div>
          </div>

          <div className="h-64 w-full">
            {timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                Awaiting transactions to plot real-time trajectory...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.7}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2E45" vertical={false} />
                  <XAxis dataKey="id" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono shadow-xl space-y-1">
                            <div className="font-bold text-white flex justify-between gap-4">
                              <span>{data.id}</span>
                              <span className={data.score >= 76 ? 'text-rose-400' : data.score >= 36 ? 'text-amber-400' : 'text-emerald-400'}>
                                {data.action}
                              </span>
                            </div>
                            <div className="text-slate-300">Risk Score: <span className="font-bold text-white">{data.score}/100</span></div>
                            <div className="text-slate-300">Amount: ₹{data.amount?.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500">{data.time}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#818CF8" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#riskGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live Top Risk Factor Pills */}
        <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between flex-wrap gap-2 text-[11px]">
          <span className="font-semibold text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Leading Risk Drivers:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {topFactorsData.length > 0 ? (
              topFactorsData.slice(0, 3).map((f, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-indigo-300 font-mono">
                  {f.factor} ({f.count})
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-[10px]">No anomalies detected in current stream</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Risk Score Histogram & Autonomous Decisions Distribution */}
      <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-border/60">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Risk Score Distribution
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              MongoDB Histogram
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2E45" vertical={false} />
                <XAxis dataKey="range" stroke="#64748B" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2E45', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {scoreBuckets.map((entry, index) => (
                    <Cell key={`bucket-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Autonomous Decision Distribution Bar */}
        <div className="pt-3 border-t border-surface-border/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Autonomous Action Breakdown</span>
            <span className="font-mono text-slate-300 text-[11px]">{totalDecisions} Total</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-900 flex overflow-hidden">
            <div 
              style={{ width: `${(allowCount / totalDecisions) * 100}%` }} 
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`ALLOW: ${allowCount} (${Math.round((allowCount / totalDecisions) * 100)}%)`}
            />
            <div 
              style={{ width: `${(reviewCount / totalDecisions) * 100}%` }} 
              className="bg-amber-500 h-full transition-all duration-500"
              title={`REVIEW: ${reviewCount} (${Math.round((reviewCount / totalDecisions) * 100)}%)`}
            />
            <div 
              style={{ width: `${(blockCount / totalDecisions) * 100}%` }} 
              className="bg-rose-500 h-full transition-all duration-500"
              title={`BLOCK: ${blockCount} (${Math.round((blockCount / totalDecisions) * 100)}%)`}
            />
          </div>

          <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-mono pt-1">
            <span className="text-emerald-400 font-bold">ALLOW: {allowCount} ({Math.round((allowCount / totalDecisions) * 100)}%)</span>
            <span className="text-amber-400 font-bold">REVIEW: {reviewCount} ({Math.round((reviewCount / totalDecisions) * 100)}%)</span>
            <span className="text-rose-400 font-bold">BLOCK: {blockCount} ({Math.round((blockCount / totalDecisions) * 100)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
