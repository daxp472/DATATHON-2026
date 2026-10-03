const { getDb } = require('../config/db');

/**
 * Customer Behavioral Profile & AI Investigation Controller
 */

// 1. Get Customer Behavioral Profile
async function getCustomerBehavioralProfile(req, res, next) {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database service unavailable' });

    const { id } = req.params;
    const customersCol = db.collection('customers');
    const txnsCol = db.collection('transactions');

    const [customer, transactions] = await Promise.all([
      customersCol.findOne({ customerId: id }),
      txnsCol.find({ customerId: id }).sort({ timestamp: -1 }).limit(100).toArray()
    ]);

    if (!customer && transactions.length === 0) {
      return res.status(404).json({ error: `Customer '${id}' not found.` });
    }

    // Compute derived behavioral metrics from stored transactions
    const amounts = transactions.map(t => t.amount || 0);
    const count = amounts.length;
    const meanAmount = count > 0 ? Math.round(amounts.reduce((a, b) => a + b, 0) / count) : (customer?.normalAverageAmount || 0);
    const minAmount = count > 0 ? Math.min(...amounts) : (customer?.normalAverageAmount || 0);
    const maxAmount = count > 0 ? Math.max(...amounts) : (customer?.normalAverageAmount || 0);

    // Compute standard deviation
    const variance = count > 1 
      ? amounts.reduce((acc, val) => acc + Math.pow(val - meanAmount, 2), 0) / (count - 1)
      : Math.pow(customer?.standardDeviation || meanAmount * 0.3, 2);
    const stdDev = Math.round(Math.sqrt(variance));

    // Usual Hours Distribution (0-23)
    const hourCounts = Array(24).fill(0);
    transactions.forEach(t => {
      const h = new Date(t.timestamp).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });

    // Usual Locations & Devices
    const locationFrequency = {};
    const deviceFrequency = {};
    const channelFrequency = {};
    let highRiskCount = 0;
    let allowCount = 0;
    let reviewCount = 0;
    let blockCount = 0;

    transactions.forEach(t => {
      const loc = t.location?.name || 'Unknown';
      locationFrequency[loc] = (locationFrequency[loc] || 0) + 1;

      const dev = t.device?.type || t.device?.id || 'Standard Device';
      deviceFrequency[dev] = (deviceFrequency[dev] || 0) + 1;

      const ch = t.channel || 'ONLINE';
      channelFrequency[ch] = (channelFrequency[ch] || 0) + 1;

      const act = t.decision?.action || 'ALLOW';
      if (act === 'ALLOW') allowCount++;
      else if (act === 'REVIEW') reviewCount++;
      else if (act === 'BLOCK') blockCount++;

      if ((t.riskResult?.riskScore || 0) >= 70) highRiskCount++;
    });

    const usualLocations = Object.entries(locationFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const usualDevices = Object.entries(deviceFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Customer Risk Timeline (Chronological order for charts)
    const riskTimeline = transactions.slice(0, 30).map(t => ({
      transactionId: t.transactionId,
      timestamp: t.timestamp,
      amount: t.amount,
      riskScore: t.riskResult?.riskScore || 0,
      riskLevel: t.riskResult?.riskLevel || 'LOW',
      decision: t.decision?.action || 'ALLOW',
      isAnomaly: Boolean(t.riskResult?.isAnomaly),
      channel: t.channel,
      location: t.location?.name,
      pattern: t.patternDetected?.detected ? t.patternDetected.primaryPattern?.name : null
    })).reverse();

    const currentRiskScore = customer?.currentRiskScore !== undefined 
      ? customer.currentRiskScore 
      : (transactions[0]?.riskResult?.riskScore || 20);

    const currentRiskLevel = customer?.currentRiskLevel || (currentRiskScore >= 76 ? 'HIGH' : currentRiskScore >= 36 ? 'MEDIUM' : 'LOW');

    const profile = {
      customerId: id,
      name: customer?.name || `Account Holder (${id})`,
      accountType: customer?.accountType || 'Standard Checking / Retail',
      currentRiskStatus: {
        riskScore: currentRiskScore,
        riskLevel: currentRiskLevel,
        lastDecision: customer?.lastDecision || transactions[0]?.decision?.action || 'ALLOW',
        lastActive: customer?.lastActive || transactions[0]?.timestamp || new Date().toISOString(),
        lastPattern: customer?.lastPatternDetected || null
      },
      baselineMetrics: {
        normalAmount: customer?.normalAverageAmount || meanAmount,
        observedMeanAmount: meanAmount,
        standardDeviation: customer?.standardDeviation || stdDev,
        minAmount,
        maxAmount,
        totalTransactionsRecorded: count
      },
      behavioralPatterns: {
        usualLocations: usualLocations.length > 0 ? usualLocations : (customer?.knownLocations || ['Mumbai, India']).map(n => ({ name: n, count: 1 })),
        usualDevices: usualDevices.length > 0 ? usualDevices : (customer?.knownDevices || ['Pixel 8 Pro']).map(n => ({ name: n, count: 1 })),
        usualHours: hourCounts,
        channels: Object.entries(channelFrequency).map(([name, count]) => ({ name, count }))
      },
      historicalRiskSummary: {
        allowCount,
        reviewCount,
        blockCount,
        highRiskCount,
        anomalyRatePct: count > 0 ? Math.round((highRiskCount / count) * 100) : 0
      },
      riskTimeline
    };

    res.json(profile);
  } catch (error) {
    next(error);
  }
}

// 2. Get Deep AI Investigation Data for a Transaction or Customer
async function getInvestigationData(req, res, next) {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database service unavailable' });

    const { transactionId } = req.params;
    const txnsCol = db.collection('transactions');
    const customersCol = db.collection('customers');

    // 1. Fetch Target Transaction
    const targetTxn = await txnsCol.findOne({ transactionId });
    if (!targetTxn) {
      return res.status(404).json({ error: `Transaction '${transactionId}' not found for investigation.` });
    }

    const customerId = targetTxn.customerId;
    const targetTimestamp = new Date(targetTxn.timestamp).getTime();
    const thirtyMinsBefore = new Date(targetTimestamp - 30 * 60 * 1000).toISOString();
    const thirtyMinsAfter = new Date(targetTimestamp + 30 * 60 * 1000).toISOString();

    // 2. Fetch Customer Baseline, Related Transactions in parallel
    const [customer, sameCustomerTxns, sameDeviceTxns, sameLocationTxns, timeWindowTxns] = await Promise.all([
      customersCol.findOne({ customerId }),
      txnsCol.find({ customerId }).sort({ timestamp: -1 }).limit(10).toArray(),
      targetTxn.device?.id 
        ? txnsCol.find({ 'device.id': targetTxn.device.id, transactionId: { $ne: transactionId } }).sort({ timestamp: -1 }).limit(10).toArray()
        : [],
      targetTxn.location?.name
        ? txnsCol.find({ 'location.name': targetTxn.location.name, transactionId: { $ne: transactionId } }).sort({ timestamp: -1 }).limit(10).toArray()
        : [],
      txnsCol.find({ 
        timestamp: { $gte: thirtyMinsBefore, $lte: thirtyMinsAfter },
        transactionId: { $ne: transactionId } 
      }).sort({ timestamp: -1 }).limit(10).toArray()
    ]);

    // 3. Compute Specific Detected Deviations
    const baselineAvg = customer?.normalAverageAmount || targetTxn.featuresExtracted?.normalCustomerAvg || 2400;
    const amountDeviationFactor = (targetTxn.amount / baselineAvg).toFixed(1);
    
    const deviations = [
      {
        feature: 'TRANSACTION_AMOUNT',
        baseline: `₹${baselineAvg.toLocaleString()} (Mean Baseline)`,
        observed: `₹${targetTxn.amount?.toLocaleString()} (${amountDeviationFactor}x)`,
        severity: Number(amountDeviationFactor) >= 10 ? 'CRITICAL' : Number(amountDeviationFactor) >= 3 ? 'HIGH' : 'NORMAL',
        description: Number(amountDeviationFactor) >= 3 
          ? `Transaction amount is ${amountDeviationFactor}x greater than customer historical mean.`
          : 'Transaction amount conforms to expected baseline band.'
      },
      {
        feature: 'DEVICE_INTEGRITY',
        baseline: customer?.knownDevices?.join(', ') || 'Primary Known Devices',
        observed: targetTxn.device?.type || targetTxn.device?.id || 'Unknown Device',
        severity: targetTxn.device?.isNew ? 'HIGH' : 'NORMAL',
        description: targetTxn.device?.isNew ? 'Unrecognized device identifier detected.' : 'Device matches verified customer hardware fingerprint.'
      },
      {
        feature: 'GEOGRAPHIC_LOCATION',
        baseline: customer?.knownLocations?.join(', ') || 'Primary Domestic Cluster',
        observed: targetTxn.location?.name || 'Unknown Location',
        severity: targetTxn.location?.isUnusual ? 'HIGH' : 'NORMAL',
        description: targetTxn.location?.isUnusual ? 'Transaction coordinates outside historical geographic perimeter.' : 'Location conforms to customer domestic profile.'
      },
      {
        feature: 'AUTHENTICATION_VELOCITY',
        baseline: '0 Recent Failed Logins',
        observed: `${targetTxn.featuresExtracted?.recentFailedAttempts || 0} Recent Failures`,
        severity: (targetTxn.featuresExtracted?.recentFailedAttempts || 0) >= 3 ? 'CRITICAL' : (targetTxn.featuresExtracted?.recentFailedAttempts || 0) > 0 ? 'HIGH' : 'NORMAL',
        description: `${targetTxn.featuresExtracted?.recentFailedAttempts || 0} consecutive authentication failures detected in rolling window.`
      },
      {
        feature: 'TIME_OF_DAY',
        baseline: '08:00 — 22:00 IST (Active Window)',
        observed: `${new Date(targetTxn.timestamp).toLocaleTimeString()} (${targetTxn.featuresExtracted?.hourOfDay || 0}:00 hrs)`,
        severity: (targetTxn.featuresExtracted?.hourOfDay >= 1 && targetTxn.featuresExtracted?.hourOfDay <= 5) ? 'MEDIUM' : 'NORMAL',
        description: (targetTxn.featuresExtracted?.hourOfDay >= 1 && targetTxn.featuresExtracted?.hourOfDay <= 5)
          ? 'Transaction initiated during unusual off-peak hours (01:00-05:00 AM).'
          : 'Transaction initiated during regular daylight active window.'
      }
    ];

    // 4. Autonomous Recommended Actions
    let recommendedActions = [];
    if (targetTxn.decision?.action === 'BLOCK' || (targetTxn.riskResult?.riskScore || 0) >= 76) {
      recommendedActions = [
        '🚨 Freeze payment settlement immediately and flag beneficiary account.',
        '🔒 Temporarily disable online banking channel until identity re-verification.',
        '📱 Send critical security alert SMS & email to customer registered contact.',
        '🛡️ Add device fingerprint and IP cluster to high-risk watchlist.'
      ];
    } else if (targetTxn.decision?.action === 'REVIEW' || (targetTxn.riskResult?.riskScore || 0) >= 36) {
      recommendedActions = [
        '⚠️ Initiate Step-Up Multi-Factor Authentication (App Push / Biometric).',
        '⏳ Hold fund release for a 15-minute verification window.',
        '📞 Request customer confirmation if transaction exceeds ₹25,000.'
      ];
    } else {
      recommendedActions = [
        '✅ Authorize transaction automatically with zero friction.',
        '📊 Update customer rolling behavioral average and device trust index.'
      ];
    }

    res.json({
      targetTransaction: targetTxn,
      customerProfile: customer || { customerId, name: `Customer ${customerId}` },
      detectedDeviations: deviations,
      attackPattern: targetTxn.patternDetected || { detected: false, patterns: [] },
      recommendedActions,
      relatedTransactions: {
        sameCustomer: sameCustomerTxns,
        sameDevice: sameDeviceTxns,
        sameLocation: sameLocationTxns,
        timeWindow: timeWindowTxns
      }
    });
  } catch (error) {
    next(error);
  }
}

// 3. Real Data Multi-Dimensional Risk Heatmap Aggregator
async function getRiskHeatmapData(req, res, next) {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database service unavailable' });

    const txnsCol = db.collection('transactions');

    // 1. Time of Day vs Risk Score (Hours 0-23)
    // 2. Location vs Risk Score
    // 3. Customer vs Risk Score
    // 4. Amount Tiers vs Risk Score
    const [timeAgg, locationAgg, customerAgg, amountAgg] = await Promise.all([
      txnsCol.aggregate([
        {
          $project: {
            hour: { $hour: { $toDate: '$timestamp' } },
            riskScore: '$riskResult.riskScore',
            decision: '$decision.action'
          }
        },
        {
          $group: {
            _id: '$hour',
            count: { $sum: 1 },
            avgRiskScore: { $avg: '$riskScore' },
            blockedCount: { $sum: { $cond: [{ $eq: ['$decision', 'BLOCK'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray(),

      txnsCol.aggregate([
        {
          $group: {
            _id: '$location.name',
            count: { $sum: 1 },
            avgRiskScore: { $avg: '$riskResult.riskScore' },
            totalAmount: { $sum: '$amount' },
            blockedCount: { $sum: { $cond: [{ $eq: ['$decision.action', 'BLOCK'] }, 1, 0] } }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),

      txnsCol.aggregate([
        {
          $group: {
            _id: '$customerId',
            count: { $sum: 1 },
            avgRiskScore: { $avg: '$riskResult.riskScore' },
            maxRiskScore: { $max: '$riskResult.riskScore' },
            blockedCount: { $sum: { $cond: [{ $eq: ['$decision.action', 'BLOCK'] }, 1, 0] } },
            allowCount: { $sum: { $cond: [{ $eq: ['$decision.action', 'ALLOW'] }, 1, 0] } }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),

      txnsCol.aggregate([
        {
          $bucket: {
            groupBy: '$amount',
            boundaries: [0, 5000, 20000, 50000, 100000, 100000000],
            default: 'Other',
            output: {
              count: { $sum: 1 },
              avgRiskScore: { $avg: '$riskResult.riskScore' },
              blockedCount: { $sum: { $cond: [{ $eq: ['$decision.action', 'BLOCK'] }, 1, 0] } }
            }
          }
        }
      ]).toArray()
    ]);

    // Format 24-hour array
    const hourHeatmap = Array.from({ length: 24 }, (_, h) => {
      const match = timeAgg.find(t => t._id === h);
      return {
        hour: `${String(h).padStart(2, '0')}:00`,
        hourNum: h,
        count: match ? match.count : 0,
        avgRisk: match ? Math.round(match.avgRiskScore || 0) : 0,
        blocked: match ? match.blockedCount : 0
      };
    });

    const amountTierLabels = {
      0: '< ₹5k (Micro)',
      5000: '₹5k - ₹20k (Standard)',
      20000: '₹20k - ₹50k (Elevated)',
      50000: '₹50k - ₹100k (High)',
      100000: '> ₹100k (Enterprise/Outlier)'
    };

    const formattedAmountTiers = amountAgg.map(a => ({
      tier: amountTierLabels[a._id] || `Tier ${a._id}`,
      count: a.count,
      avgRisk: Math.round(a.avgRiskScore || 0),
      blocked: a.blockedCount
    }));

    res.json({
      timeVsRisk: hourHeatmap,
      locationVsRisk: locationAgg.map(l => ({
        location: l._id || 'Unknown',
        count: l.count,
        avgRisk: Math.round(l.avgRiskScore || 0),
        totalAmount: l.totalAmount || 0,
        blocked: l.blockedCount
      })),
      customerVsRisk: customerAgg.map(c => ({
        customerId: c._id,
        count: c.count,
        avgRisk: Math.round(c.avgRiskScore || 0),
        maxRisk: c.maxRiskScore || 0,
        blocked: c.blockedCount,
        allowed: c.allowCount
      })),
      amountVsRisk: formattedAmountTiers,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

// 4. List Customers
async function listCustomers(req, res, next) {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database service unavailable' });

    const customersCol = db.collection('customers');
    const customers = await customersCol.find({}).toArray();
    res.json({ customers });
  } catch (error) {
    next(error);
  }
}

// 5. Customer History
async function getCustomerHistory(req, res, next) {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database service unavailable' });

    const { id } = req.params;
    const customersCol = db.collection('customers');
    const txnsCol = db.collection('transactions');

    const [customer, history] = await Promise.all([
      customersCol.findOne({ customerId: id }),
      txnsCol.find({ customerId: id }).sort({ timestamp: -1 }).limit(20).toArray()
    ]);

    if (!customer && history.length === 0) {
      return res.status(404).json({ error: `Customer profile for '${id}' not found.` });
    }

    res.json({
      customer: customer || { customerId: id, status: 'DYNAMIC_PROFILE' },
      transactions: history,
      totalRecorded: history.length
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCustomerBehavioralProfile,
  getInvestigationData,
  getRiskHeatmapData,
  getCustomerHistory,
  listCustomers
};
