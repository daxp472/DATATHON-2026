/**
 * Predefined Simulation Scenarios for Local Testing
 * All scenarios produce strictly synthetic demo transactions and flow through the real AI pipeline.
 */

const SCENARIOS = {
  NORMAL: {
    id: 'normal',
    name: 'Normal Transaction',
    description: 'Amount close to historical average, known device, normal daytime, primary location.',
    expectedRisk: 'LOW',
    expectedDecision: 'ALLOW',
    template: (customer) => ({
      amount: Math.round((customer?.normalAvgAmount || 2400) * (0.85 + Math.random() * 0.3)),
      isNewDevice: false,
      deviceId: customer?.knownDevices?.[0] || 'DEV-IOS-IPHONE15-AARAV',
      location: customer?.knownLocations?.[0] || 'Mumbai, India',
      isUnusualLocation: false,
      hourOfDay: 14,
      recentFailedAttempts: 0,
      recentSuspiciousAttempts: 0,
      transactionVelocity1h: 1,
      channel: 'ONLINE_BANKING',
      scenario: 'normal'
    })
  },

  HIGH_AMOUNT: {
    id: 'high-amount',
    name: 'High Amount Deviation',
    description: 'Transaction amount is 20x-30x higher than normal customer baseline.',
    expectedRisk: 'ELEVATED / HIGH',
    expectedDecision: 'REVIEW / BLOCK',
    template: (customer) => ({
      amount: Math.round((customer?.normalAvgAmount || 2400) * 22),
      isNewDevice: false,
      deviceId: customer?.knownDevices?.[0] || 'DEV-IOS-IPHONE15-AARAV',
      location: customer?.knownLocations?.[0] || 'Mumbai, India',
      isUnusualLocation: false,
      hourOfDay: 15,
      recentFailedAttempts: 0,
      recentSuspiciousAttempts: 0,
      transactionVelocity1h: 1,
      channel: 'ONLINE_BANKING',
      scenario: 'high-amount'
    })
  },

  NEW_DEVICE: {
    id: 'new-device',
    name: 'New Device Login',
    description: 'Transaction initiated from an unrecognized device identifier.',
    expectedRisk: 'MEDIUM',
    expectedDecision: 'REVIEW',
    template: (customer) => ({
      amount: Math.round((customer?.normalAvgAmount || 2400) * 1.8),
      isNewDevice: true,
      deviceId: `DEV-NEW-ANDROID-${Math.floor(1000 + Math.random() * 9000)}`,
      deviceType: 'Unregistered Android Tablet (Firefox)',
      location: customer?.knownLocations?.[0] || 'Mumbai, India',
      isUnusualLocation: false,
      hourOfDay: 16,
      recentFailedAttempts: 0,
      recentSuspiciousAttempts: 0,
      transactionVelocity1h: 1,
      channel: 'MOBILE_APP',
      scenario: 'new-device'
    })
  },

  UNUSUAL_LOCATION: {
    id: 'unusual-location',
    name: 'Unusual Location Anomaly',
    description: 'Transaction initiated from an unfamiliar geographic region or foreign IP.',
    expectedRisk: 'MEDIUM / HIGH',
    expectedDecision: 'REVIEW / BLOCK',
    template: (customer) => ({
      amount: Math.round((customer?.normalAvgAmount || 2400) * 2.2),
      isNewDevice: false,
      deviceId: customer?.knownDevices?.[0] || 'DEV-IOS-IPHONE15-AARAV',
      location: 'Bucharest, Romania',
      isUnusualLocation: true,
      hourOfDay: 13,
      recentFailedAttempts: 0,
      recentSuspiciousAttempts: 0,
      transactionVelocity1h: 1,
      channel: 'ONLINE_BANKING',
      scenario: 'unusual-location'
    })
  },

  UNUSUAL_TIME: {
    id: 'unusual-time',
    name: 'Unusual Time (Off-Peak Anomaly)',
    description: 'Transaction initiated at 03:17 AM outside standard customer active hours.',
    expectedRisk: 'ELEVATED',
    expectedDecision: 'REVIEW',
    template: (customer) => ({
      amount: Math.round((customer?.normalAvgAmount || 2400) * 2.5),
      isNewDevice: false,
      deviceId: customer?.knownDevices?.[0] || 'DEV-IOS-IPHONE15-AARAV',
      location: customer?.knownLocations?.[0] || 'Mumbai, India',
      isUnusualLocation: false,
      hourOfDay: 3,
      recentFailedAttempts: 0,
      recentSuspiciousAttempts: 0,
      transactionVelocity1h: 1,
      channel: 'ONLINE_BANKING',
      scenario: 'unusual-time'
    })
  },

  HIGH_VELOCITY: {
    id: 'high-velocity',
    name: 'High Transaction Velocity',
    description: 'Rapid burst of 7-10 transactions within a single hour.',
    expectedRisk: 'HIGH',
    expectedDecision: 'REVIEW / BLOCK',
    template: (customer) => ({
      amount: Math.round((customer?.normalAvgAmount || 2400) * 1.4),
      isNewDevice: false,
      deviceId: customer?.knownDevices?.[0] || 'DEV-IOS-IPHONE15-AARAV',
      location: customer?.knownLocations?.[0] || 'Mumbai, India',
      isUnusualLocation: false,
      hourOfDay: 14,
      recentFailedAttempts: 0,
      recentSuspiciousAttempts: 0,
      transactionVelocity1h: 8,
      channel: 'ONLINE_BANKING',
      scenario: 'high-velocity'
    })
  },

  FAILED_ATTEMPTS: {
    id: 'failed-attempts',
    name: 'Prior Failed Authentications',
    description: 'Transaction preceded by 3-4 consecutive failed auth or OTP attempts.',
    expectedRisk: 'HIGH',
    expectedDecision: 'REVIEW / BLOCK',
    template: (customer) => ({
      amount: Math.round((customer?.normalAvgAmount || 2400) * 1.9),
      isNewDevice: false,
      deviceId: customer?.knownDevices?.[0] || 'DEV-IOS-IPHONE15-AARAV',
      location: customer?.knownLocations?.[0] || 'Mumbai, India',
      isUnusualLocation: false,
      hourOfDay: 15,
      recentFailedAttempts: 3,
      recentSuspiciousAttempts: 1,
      transactionVelocity1h: 2,
      channel: 'ONLINE_BANKING',
      scenario: 'failed-attempts'
    })
  },

  BEHAVIOR_CHANGE: {
    id: 'behavior-change',
    name: 'Sudden Behavioral Drift',
    description: 'Customer jumps from ₹2,400 to ₹72,000 with new device and new location.',
    expectedRisk: 'HIGH',
    expectedDecision: 'BLOCK',
    template: (customer) => ({
      amount: 72000.0,
      isNewDevice: true,
      deviceId: `DEV-UNKNOWN-LINUX-${Math.floor(100 + Math.random() * 900)}`,
      deviceType: 'Linux Workstation (Chrome Emulated)',
      location: 'Frankfurt, Germany',
      isUnusualLocation: true,
      hourOfDay: 2,
      recentFailedAttempts: 1,
      recentSuspiciousAttempts: 1,
      transactionVelocity1h: 3,
      channel: 'ONLINE_BANKING',
      scenario: 'behavior-change'
    })
  },

  MULTI_SIGNAL: {
    id: 'multi-signal',
    name: 'Multi-Signal Coordinated Attack',
    description: 'Severe compound anomaly: ₹87,500 + New Device + Unusual Location + 03:17 AM + Velocity + Failed Attempts.',
    expectedRisk: 'HIGH (90-100)',
    expectedDecision: 'BLOCK',
    template: (customer) => ({
      amount: 87500.0,
      isNewDevice: true,
      deviceId: 'DEV-UNRECOGNIZED-EMULATOR-PRO',
      deviceType: 'Custom Android Script Emulator',
      location: 'Bucharest, Romania',
      isUnusualLocation: true,
      hourOfDay: 3,
      recentFailedAttempts: 3,
      recentSuspiciousAttempts: 2,
      transactionVelocity1h: 6,
      channel: 'ONLINE_BANKING',
      scenario: 'multi-signal'
    })
  }
};

module.exports = {
  SCENARIOS
};
