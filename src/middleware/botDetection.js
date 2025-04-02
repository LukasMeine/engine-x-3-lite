// middleware/botDetection.js
const { getClientIp } = require('../utils/ipUtils');
const { logRequest } = require('../utils/logger');
const { getBrowserInfo } = require('../utils/browserUtils');
const { checkIpAddress: checkIpWithAntiBot } = require('../utils/moonito');

const SUSPICIOUS_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /lighthouse/i,
  /headless/i, /preview/i, /postman/i, /http/i,
  /python/i, /curl/i, /wget/i, /node/i, /axios/i,
  /puppeteer/i, /playwright/i, /selenium/i
];

const REQUIRED_HEADERS = [
  'user-agent',
  'accept',
  'accept-language',
  'accept-encoding',
  'connection'
];

const BLOCKED_DIRECTORIES = [
  '/admin', '/config', '/.git', '/.env', '/logs', '/backup', '/uploads', '/node_modules', '/favicon.ico'
];

const requestLogs = new Map();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
  const cutoff = Date.now() - CLEANUP_INTERVAL;
  for (const [key, data] of requestLogs.entries()) {
    if (data.lastRequest < cutoff) {
      requestLogs.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

async function botDetectionMiddleware(req, res, next) {
  const BOT_URL = process.env.BOT_URL || 'https://you-are-a-bot.com';

  // If Passive Mode is enabled, redirect all requests to BOT_URL.
  const passiveModeEnabled = process.env.PASSIVE_MODE &&
      (process.env.PASSIVE_MODE.toLowerCase() === 'true' || process.env.PASSIVE_MODE.toLowerCase() === 'enabled');
  if (passiveModeEnabled) {
    return res.redirect(BOT_URL);
  }

  // If test Mode is enabled, skip antibot check.
  const testModeEnabled = process.env.TEST_MODE &&
      (process.env.TEST_MODE.toLowerCase() === 'true' || process.env.TEST_MODE.toLowerCase() === 'enabled');
  if (testModeEnabled) {
    req.trustScore = 100;
    next();
    return
  }

  const clientIp = getClientIp(req);
  const antiBotReport = await checkIpWithAntiBot(clientIp, req.headers['user-agent']);

  // Block requests to restricted paths.
  const blockedPaths = ['/favico.ico', ...BLOCKED_DIRECTORIES];
  if (blockedPaths.includes(req.path)) {
    logRequest({
      ip: clientIp,
      userAgent: req.headers['user-agent'] || 'Unknown',
      status: 'blocked',
      reason: 'Access to restricted path',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
    return res.redirect(BOT_URL);
  }

  // Immediately redirect if the AntiBot API identifies the request as coming from a bot.
  if (antiBotReport.data && antiBotReport.data.status.is_bot) {
    logRequest({
      ip: clientIp,
      userAgent: req.headers['user-agent'] || 'Unknown',
      status: 'blocked',
      reason: 'Identified as bot by AntiBot API',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
    return res.redirect(BOT_URL);
  }

  const score = await calculateTrustScore(req, clientIp);
  const userAgent = req.headers['user-agent'] || 'Unknown';

  if (score < 70) {
    logRequest({
      ip: clientIp,
      userAgent,
      browser: getBrowserInfo(userAgent),
      trustScore: score,
      isBot: true,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      status: 'blocked'
    });
    return res.redirect(BOT_URL);
  }

  req.trustScore = score;
  next();
}

async function calculateTrustScore(req, clientIp) {
  let score = 100;
  const ua = req.headers['user-agent'] || '';

  if (!ua || SUSPICIOUS_PATTERNS.some(pattern => pattern.test(ua))) {
    score -= 40;
  }

  const missingHeaders = REQUIRED_HEADERS.filter(h => !req.headers[h]);
  score -= (missingHeaders.length * 10);

  const requestData = getRequestData(clientIp);
  if (requestData.count > 10) {
    score -= 30;
  }

  // Resetting score for demonstration purposes.
  score = 100;
  return Math.max(0, score);
}

function getRequestData(clientIp) {
  const now = Date.now();
  const data = requestLogs.get(clientIp) || { count: 0, lastRequest: 0 };

  if (now - data.lastRequest > 60000) {
    data.count = 1;
  } else {
    data.count++;
  }

  data.lastRequest = now;
  requestLogs.set(clientIp, data);

  return data;
}

module.exports = { botDetectionMiddleware };
