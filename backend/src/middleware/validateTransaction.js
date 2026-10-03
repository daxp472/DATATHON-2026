/**
 * Middleware to validate incoming transaction payloads
 */
function validateTransaction(req, res, next) {
  const { customerId, amount } = req.body;

  if (!customerId || typeof customerId !== 'string' || customerId.trim() === '') {
    return res.status(400).json({
      error: 'Validation Error: customerId is required and must be a non-empty string.',
      field: 'customerId'
    });
  }

  if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      error: 'Validation Error: amount must be a positive number greater than 0.',
      field: 'amount'
    });
  }

  // Ensure default fallback values for optional attributes
  if (!req.body.transactionId) {
    req.body.transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  if (!req.body.timestamp) {
    req.body.timestamp = new Date().toISOString();
  }

  if (req.body.isSimulation === undefined) {
    req.body.isSimulation = true; // Default to true if not explicitly marked
  }

  next();
}

module.exports = {
  validateTransaction
};
