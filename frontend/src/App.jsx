import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Navbar from './components/Navbar';
import LiveDashboard from './components/LiveDashboard';
import SimulationCenter from './components/SimulationCenter';
import TransactionInspector from './components/TransactionInspector';
import InvestigationWorkbench from './components/InvestigationWorkbench';
import RiskHeatmap from './components/RiskHeatmap';

const BACKEND_URL = 'http://localhost:5000';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'investigation' | 'heatmap' | 'simulation'
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [ibmZStatusData, setIbmZStatusData] = useState(null);
  const [socketStatus, setSocketStatus] = useState('connecting');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [investigatingTransactionId, setInvestigatingTransactionId] = useState(null);
  const [investigatingCustomerId, setInvestigatingCustomerId] = useState('CUST-1001');
  const [latestLiveAlert, setLatestLiveAlert] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [customerRiskUpdateNotification, setCustomerRiskUpdateNotification] = useState(null);

  // Fetch initial dashboard state
  const loadInitialData = async () => {
    setIsRefreshing(true);
    try {
      const [healthRes, statsRes, txnsRes, alertsRes, ibmZRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/health`).then(r => r.json()).catch(() => null),
        fetch(`${BACKEND_URL}/api/dashboard/stats`).then(r => r.json()).catch(() => null),
        fetch(`${BACKEND_URL}/api/transactions?limit=50`).then(r => r.json()).catch(() => ({ transactions: [] })),
        fetch(`${BACKEND_URL}/api/alerts?limit=20`).then(r => r.json()).catch(() => ({ alerts: [] })),
        fetch(`${BACKEND_URL}/api/integrations/ibm-z/status`).then(r => r.json()).catch(() => null)
      ]);

      if (healthRes) setHealthData(healthRes);
      if (statsRes) setStats(statsRes);
      if (txnsRes?.transactions) setTransactions(txnsRes.transactions);
      if (alertsRes?.alerts) setAlerts(alertsRes.alerts);
      if (ibmZRes) setIbmZStatusData(ibmZRes);
    } catch (err) {
      console.error('[App] Failed to load dashboard state:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Setup Socket.io real-time connection
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setSocketStatus('connected');
      console.log('[Socket.io] Real-time stream connected.');
    });

    socket.on('transaction:new', (newTxn) => {
      setTransactions((prev) => [newTxn, ...prev.slice(0, 49)]);
      
      // If transaction is BLOCK or score >= 76, trigger top alert flash banner
      if (newTxn.decision?.action === 'BLOCK' || (newTxn.riskResult?.riskScore || 0) >= 76) {
        setLatestLiveAlert({
          transactionId: newTxn.transactionId,
          customerId: newTxn.customerId,
          amount: newTxn.amount,
          riskScore: newTxn.riskResult?.riskScore,
          riskLevel: newTxn.riskResult?.riskLevel,
          action: newTxn.decision?.action,
          reasons: newTxn.riskResult?.reasons
        });
      }
    });

    socket.on('alert:new', (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev.slice(0, 19)]);
      setLatestLiveAlert(newAlert);
    });

    socket.on('dashboard:stats', (newStats) => {
      setStats((prev) => ({ ...prev, ...newStats }));
    });

    socket.on('customer:risk_updated', (riskUpdate) => {
      console.log('[Socket.io] Customer risk updated in real-time:', riskUpdate);
      setCustomerRiskUpdateNotification(riskUpdate);
      setTimeout(() => setCustomerRiskUpdateNotification(null), 4000);
    });

    socket.on('disconnect', () => {
      setSocketStatus('disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleTriggerFullDemo = async () => {
    setIsDemoRunning(true);
    try {
      await fetch(`${BACKEND_URL}/api/simulation/full-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMs: 800, customerId: 'CUST-1001' })
      });
      await loadInitialData();
    } catch (err) {
      console.error('[App] Full demo execution failed:', err);
    } finally {
      setIsDemoRunning(false);
    }
  };

  const handleNavigateToInvestigation = (txn) => {
    if (txn) {
      setInvestigatingTransactionId(txn.transactionId);
      if (txn.customerId) setInvestigatingCustomerId(txn.customerId);
    }
    setActiveTab('investigation');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        socketStatus={socketStatus}
        healthData={healthData}
        ibmZStatus={ibmZStatusData?.status || 'DEMONSTRATION_MODE'}
        onRefreshHealth={loadInitialData}
        isRefreshing={isRefreshing}
        onTriggerFullDemo={handleTriggerFullDemo}
        isDemoRunning={isDemoRunning}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <LiveDashboard
            transactions={transactions}
            alerts={alerts}
            stats={stats}
            ibmZStatusData={ibmZStatusData}
            onSelectTransaction={setSelectedTransaction}
            selectedTransaction={selectedTransaction}
            latestLiveAlert={latestLiveAlert}
            onDismissAlert={() => setLatestLiveAlert(null)}
          />
        )}

        {activeTab === 'investigation' && (
          <InvestigationWorkbench
            transactions={transactions}
            onSelectTransaction={setSelectedTransaction}
            initialTransactionId={investigatingTransactionId}
            initialCustomerId={investigatingCustomerId}
          />
        )}

        {activeTab === 'heatmap' && (
          <RiskHeatmap
            onSelectCustomer={(cId) => {
              setInvestigatingCustomerId(cId);
              setActiveTab('investigation');
            }}
            onRefreshDashboard={loadInitialData}
          />
        )}

        {activeTab === 'simulation' && (
          <SimulationCenter
            onSelectTransaction={setSelectedTransaction}
            recentTransactions={transactions}
            healthData={healthData}
            ibmZStatusData={ibmZStatusData}
            onRefreshDashboard={loadInitialData}
          />
        )}
      </main>

      {/* Transaction Details & Feature Inspector Modal */}
      {selectedTransaction && (
        <TransactionInspector
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

      {/* Global Footer */}
      <footer className="border-t border-surface-border py-4 bg-surface/40 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Datathon 2026 • Real-Time AI Fraud &amp; Risk Decision Engine</span>
          <span className="font-mono text-[11px] text-slate-400">
            Phase 7: Behavioral Profiles • Multivariate XAI • Pattern Detection • Real-Time Risk Heatmap
          </span>
          <span className="text-amber-400 font-mono text-[11px]">
            DEMO / SIMULATION DATA ONLY
          </span>
        </div>
      </footer>
    </div>
  );
}
