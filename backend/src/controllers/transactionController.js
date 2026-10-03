const { getDb } = require('../config/db');
const { transactionPipeline } = require('../services/transactionPipeline');

/**
 * Transaction Controller
 */
async function createTransaction(req, res, next) {
  try {
    const result = await transactionPipeline.process(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function getTransactions(req, res, next) {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const { 
      limit = 50, 
      page = 1, 
      decision, 
      riskLevel, 
      customerId, 
      isSimulation,
      scenario,
      search 
    } = req.query;

    const query = {};
    if (decision && decision !== 'ALL') query['decision.action'] = decision.toUpperCase();
    if (riskLevel && riskLevel !== 'ALL') query['riskResult.riskLevel'] = riskLevel.toUpperCase();
    if (customerId && customerId !== 'ALL') query.customerId = customerId;
    if (scenario && scenario !== 'ALL') query.scenario = scenario;
    if (isSimulation !== undefined && isSimulation !== 'ALL') {
      query.isSimulation = isSimulation === 'true' || isSimulation === true;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { transactionId: searchRegex },
        { customerId: searchRegex },
        { 'location.name': searchRegex },
        { 'device.type': searchRegex }
      ];
    }

    const limitNum = Math.min(parseInt(limit, 10) || 50, 200);
    const skipNum = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limitNum;

    const txnsCol = db.collection('transactions');
    const [transactions, total] = await Promise.all([
      txnsCol.find(query)
        .sort({ timestamp: -1 })
        .skip(skipNum)
        .limit(limitNum)
        .toArray(),
      txnsCol.countDocuments(query)
    ]);

    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getTransactionById(req, res, next) {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const { id } = req.params;
    const txnsCol = db.collection('transactions');
    const transaction = await txnsCol.findOne({ transactionId: id });

    if (!transaction) {
      return res.status(404).json({ error: `Transaction with ID '${id}' not found.` });
    }

    res.json(transaction);
  } catch (error) {
    next(error);
  }
}

async function getAlerts(req, res, next) {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database service unavailable' });

    const { limit = 20 } = req.query;
    const alertsCol = db.collection('alerts');
    const alerts = await alertsCol.find({})
      .sort({ timestamp: -1 })
      .limit(Math.min(parseInt(limit, 10), 100))
      .toArray();

    res.json({ alerts, count: alerts.length });
  } catch (error) {
    next(error);
  }
}

async function getDashboardStats(req, res, next) {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database service unavailable' });

    const txnsCol = db.collection('transactions');
    const alertsCol = db.collection('alerts');

    const [
      totalCount, 
      allowCount, 
      reviewCount, 
      blockCount, 
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      activeAlertsCount,
      aggregates
    ] = await Promise.all([
      txnsCol.countDocuments(),
      txnsCol.countDocuments({ 'decision.action': 'ALLOW' }),
      txnsCol.countDocuments({ 'decision.action': 'REVIEW' }),
      txnsCol.countDocuments({ 'decision.action': 'BLOCK' }),
      txnsCol.countDocuments({ 'riskResult.riskScore': { $gte: 76 } }),
      txnsCol.countDocuments({ 'riskResult.riskScore': { $gte: 36, $lte: 75 } }),
      txnsCol.countDocuments({ 'riskResult.riskScore': { $lte: 35 } }),
      alertsCol.countDocuments({ resolved: false }),
      txnsCol.aggregate([
        { 
          $group: { 
            _id: null, 
            avgScore: { $avg: '$riskResult.riskScore' },
            totalAmount: { $sum: '$amount' }
          } 
        }
      ]).toArray()
    ]);

    const avgRisk = aggregates.length > 0 ? Math.round(aggregates[0].avgScore || 0) : 0;
    const totalVolume = aggregates.length > 0 ? aggregates[0].totalAmount || 0 : 0;

    res.json({
      totalTransactions: totalCount,
      decisions: {
        allow: allowCount,
        review: reviewCount,
        block: blockCount
      },
      riskTiers: {
        low: lowRiskCount,
        medium: mediumRiskCount,
        high: highRiskCount
      },
      activeAlerts: activeAlertsCount,
      averageRiskScore: avgRisk,
      totalVolumeAmount: totalVolume,
      allowRatePct: totalCount > 0 ? Math.round((allowCount / totalCount) * 100) : 100,
      blockRatePct: totalCount > 0 ? Math.round((blockCount / totalCount) * 100) : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

async function getRiskAnalytics(req, res, next) {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database service unavailable' });

    const txnsCol = db.collection('transactions');

    // 1. Risk Score Distribution (0-20, 21-40, 41-60, 61-80, 81-100)
    const [distribution, recentTimeTrend, topReasonsAgg] = await Promise.all([
      txnsCol.aggregate([
        {
          $bucket: {
            groupBy: '$riskResult.riskScore',
            boundaries: [0, 21, 41, 61, 81, 101],
            default: 'Other',
            output: { count: { $sum: 1 } }
          }
        }
      ]).toArray(),
      txnsCol.find({})
        .sort({ timestamp: -1 })
        .limit(30)
        .project({
          transactionId: 1,
          customerId: 1,
          timestamp: 1,
          amount: 1,
          'riskResult.riskScore': 1,
          'riskResult.riskLevel': 1,
          'decision.action': 1
        })
        .toArray(),
      txnsCol.aggregate([
        { $unwind: '$riskResult.reasons' },
        { $group: { _id: '$riskResult.reasons', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]).toArray()
    ]);

    const topRiskFactors = topReasonsAgg.map(r => ({
      factor: r._id,
      count: r.count
    }));

    res.json({
      distribution,
      recentTimeTrend: recentTimeTrend.reverse(),
      topRiskFactors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

async function exportTransactions(req, res, next) {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database service unavailable' });

    const { format = 'json', limit = 500 } = req.query;
    const txnsCol = db.collection('transactions');
    
    const transactions = await txnsCol.find({})
      .sort({ timestamp: -1 })
      .limit(Math.min(parseInt(limit, 10) || 500, 2000))
      .toArray();

    if (format.toLowerCase() === 'csv') {
      const headers = ['transactionId', 'customerId', 'timestamp', 'amount', 'currency', 'decision', 'riskScore', 'riskLevel', 'anomalyProb', 'reasons', 'channel', 'location', 'isSimulation'];
      const rows = transactions.map(t => [
        t.transactionId,
        t.customerId,
        t.timestamp,
        t.amount,
        t.currency || 'USD',
        t.decision?.action || 'UNKNOWN',
        t.riskResult?.riskScore || 0,
        t.riskResult?.riskLevel || 'LOW',
        (t.riskResult?.anomalyProbability || 0).toFixed(4),
        `"${(t.riskResult?.reasons || []).join('; ').replace(/"/g, '""')}"`,
        t.channel || 'WEB',
        `"${(t.location?.name || '').replace(/"/g, '""')}"`,
        t.isSimulation ? 'TRUE' : 'FALSE'
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="fraud_engine_transactions_${Date.now()}.csv"`);
      return res.status(200).send(csvContent);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="fraud_engine_transactions_${Date.now()}.json"`);
    return res.status(200).json({
      exportTimestamp: new Date().toISOString(),
      count: transactions.length,
      transactions
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  getAlerts,
  getDashboardStats,
  getRiskAnalytics,
  exportTransactions
};

