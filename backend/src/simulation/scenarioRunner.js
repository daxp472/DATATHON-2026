const { transactionGenerator } = require('./generators/transactionGenerator');
const { transactionPipeline } = require('../services/transactionPipeline');
const { SCENARIOS } = require('./scenarios/scenarioDefinitions');

class ScenarioRunner {
  constructor() {
    this.activeStream = null;
    this.isStreaming = false;
  }

  /**
   * Run a single predefined scenario through the REAL pipeline
   */
  async runScenario(scenarioKey, customerId = 'CUST-1001', customOverrides = {}) {
    console.log(`[Simulation] Executing scenario: ${scenarioKey} for customer: ${customerId}`);
    const rawPayload = await transactionGenerator.generateScenarioTransaction(scenarioKey, customerId, customOverrides);
    
    // Send strictly through the real transaction pipeline
    const result = await transactionPipeline.process(rawPayload);
    return result;
  }

  /**
   * Run a custom transaction through the REAL pipeline
   */
  async runCustomTransaction(customInputs) {
    console.log('[Simulation] Executing user-defined custom transaction');
    const rawPayload = transactionGenerator.generateCustomTransaction(customInputs);
    
    const result = await transactionPipeline.process(rawPayload);
    return result;
  }

  /**
   * Run a batch of transactions sequentially through the REAL pipeline
   */
  async runBatch({ scenario = 'normal', count = 10, intervalMs = 250, customerId = 'CUST-1001' }, onProgress = null) {
    const totalCount = Math.min(Math.max(1, parseInt(count, 10) || 10), 100);
    const interval = Math.min(Math.max(50, parseInt(intervalMs, 10) || 250), 5000);
    
    const results = [];
    const summary = {
      scenario,
      totalRequested: totalCount,
      processed: 0,
      anomalies: 0,
      decisions: {
        ALLOW: 0,
        REVIEW: 0,
        BLOCK: 0
      },
      averageRiskScore: 0,
      highestRiskScore: 0,
      factorCounts: {},
      topDetectedFactors: [],
      startTime: new Date().toISOString(),
      endTime: null
    };

    let totalScoreSum = 0;

    for (let i = 0; i < totalCount; i++) {
      let currentScenario = scenario;
      
      // If scenario is 'mixed', interleave 70% normal with 30% anomalous variations
      if (scenario === 'mixed') {
        const rand = Math.random();
        if (rand < 0.65) {
          currentScenario = 'normal';
        } else if (rand < 0.85) {
          currentScenario = 'new-device';
        } else {
          currentScenario = 'multi-signal';
        }
      }

      const rawPayload = await transactionGenerator.generateScenarioTransaction(currentScenario, customerId);
      const res = await transactionPipeline.process(rawPayload);
      
      results.push(res);
      summary.processed++;
      
      const score = res.riskResult?.riskScore || 0;
      totalScoreSum += score;
      if (score > summary.highestRiskScore) summary.highestRiskScore = score;
      if (score >= 70 || res.riskResult?.isAnomaly) summary.anomalies++;

      const action = res.decision?.action || 'ALLOW';
      summary.decisions[action] = (summary.decisions[action] || 0) + 1;

      // Count factor frequencies
      (res.riskResult?.reasons || []).forEach(reason => {
        summary.factorCounts[reason] = (summary.factorCounts[reason] || 0) + 1;
      });

      if (onProgress) {
        onProgress({ current: i + 1, total: totalCount, latestResult: res });
      }

      if (i < totalCount - 1 && interval > 0) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    summary.averageRiskScore = summary.processed > 0 ? Math.round(totalScoreSum / summary.processed) : 0;
    summary.endTime = new Date().toISOString();

    // Sort top detected factors
    summary.topDetectedFactors = Object.entries(summary.factorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, count }));

    return { summary, results };
  }

  /**
   * Start a continuous stream simulation
   */
  startStreamSimulation({ count = 25, intervalMs = 1000, anomalyRatio = 0.2, customerId = 'CUST-1001' }, onEvent) {
    if (this.isStreaming) {
      this.stopStreamSimulation();
    }

    this.isStreaming = true;
    let sent = 0;
    const total = count;

    this.activeStream = setInterval(async () => {
      if (!this.isStreaming || sent >= total) {
        this.stopStreamSimulation();
        return;
      }

      sent++;
      // Determine if this stream event should be anomalous based on anomalyRatio
      const isAnomaly = Math.random() < anomalyRatio;
      const scenarioChoice = isAnomaly 
        ? ['high-amount', 'new-device', 'unusual-location', 'behavior-change', 'multi-signal'][Math.floor(Math.random() * 5)]
        : 'normal';

      try {
        const rawPayload = await transactionGenerator.generateScenarioTransaction(scenarioChoice, customerId);
        const result = await transactionPipeline.process(rawPayload);
        if (onEvent) onEvent(result, sent, total);
      } catch (err) {
        console.error(`[Stream Simulation Error] ${err.message}`);
      }
    }, intervalMs);
  }

  stopStreamSimulation() {
    if (this.activeStream) {
      clearInterval(this.activeStream);
      this.activeStream = null;
    }
    this.isStreaming = false;
    console.log('[Simulation] Stream simulation stopped.');
  }

  /**
   * One-Click Full Datathon Demonstration Sequence
   * 1. Normal Retail Transaction -> ALLOW
   * 2. Step-up Unregistered Device -> REVIEW
   * 3. High-Risk Multi-Signal Attack -> BLOCK & Alert
   * 4. IBM Z Enterprise CICS Event -> Ingest & ALLOW
   * 5. IBM Z Mainframe Attack -> BLOCK & Critical Alert
   */
  async runFullDemoSequence(intervalMs = 800) {
    const { ibmZSimulator } = require('../integrations/ibm-z/ibmZSimulator');
    const steps = [
      { name: '1. Normal Retail Transaction', run: () => this.runScenario('normal', 'CUST-1001') },
      { name: '2. Suspicious Step-Up Device', run: () => this.runScenario('new-device', 'CUST-1002') },
      { name: '3. Multi-Signal Outlier Attack', run: () => this.runScenario('multi-signal', 'CUST-1001') },
      { name: '4. IBM Z Normal CICS Transaction', run: () => ibmZSimulator.simulateNormalCICS('CUST-DEMO-CORP') },
      { name: '5. IBM Z Mainframe Security Attack', run: () => ibmZSimulator.simulateMainframeAttack('CUST-DEMO-CORP') }
    ];

    const results = [];
    for (let i = 0; i < steps.length; i++) {
      console.log(`[Full Demo] Executing Step ${i + 1}/${steps.length}: ${steps[i].name}`);
      const res = await steps[i].run();
      results.push({ step: steps[i].name, result: res });
      
      if (i < steps.length - 1 && intervalMs > 0) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    return {
      status: 'DEMO_COMPLETED',
      stagesExecuted: steps.length,
      totalSteps: steps.length,
      executedAt: new Date().toISOString(),
      sequence: results
    };
  }

  getStreamingStatus() {
    return { isStreaming: this.isStreaming };
  }
}

const scenarioRunner = new ScenarioRunner();
module.exports = {
  ScenarioRunner,
  scenarioRunner
};
