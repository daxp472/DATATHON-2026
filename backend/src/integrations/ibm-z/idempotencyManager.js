const { getDb } = require('../../config/db');

class IdempotencyManager {
  constructor() {
    this.memoryCache = new Map();
    this.ttlMs = 10 * 60 * 1000; // 10 minutes cache window
  }

  /**
   * Check if an event ID or transaction ID was already processed
   * @param {string} eventId 
   * @param {string} transactionId 
   * @returns {Promise<Object|null>} Cached decision result if duplicate, or null
   */
  async checkDuplicate(eventId, transactionId) {
    const key = eventId || transactionId;
    if (!key) return null;

    // 1. Check in-memory fast cache
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      if (Date.now() - cached.storedAt < this.ttlMs) {
        console.log(`[Idempotency] Duplicate enterprise event caught in memory cache: ${key}`);
        return { isDuplicate: true, cachedRecord: cached.record };
      } else {
        this.memoryCache.delete(key);
      }
    }

    // 2. Check MongoDB transactions collection
    const db = getDb();
    if (db) {
      try {
        const txnsCol = db.collection('transactions');
        const query = eventId ? { $or: [{ eventId }, { transactionId }] } : { transactionId };
        const existing = await txnsCol.findOne(query);

        if (existing) {
          console.log(`[Idempotency] Duplicate enterprise event found in MongoDB: ${key}`);
          this.memoryCache.set(key, { storedAt: Date.now(), record: existing });
          return { isDuplicate: true, cachedRecord: existing };
        }
      } catch (err) {
        console.warn(`[Idempotency] Database lookup warning: ${err.message}`);
      }
    }

    return null;
  }

  /**
   * Record processed event in cache
   */
  recordProcessed(eventId, transactionId, resultRecord) {
    const key = eventId || transactionId;
    if (!key) return;

    this.memoryCache.set(key, {
      storedAt: Date.now(),
      record: resultRecord
    });
  }
}

const idempotencyManager = new IdempotencyManager();
module.exports = {
  IdempotencyManager,
  idempotencyManager
};
