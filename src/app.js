require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const favicon = require('serve-favicon');
const session = require('express-session');
const fs = require('fs');

const config = require('./config/config');
const routes = require('./routes/routes');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.use(session(config.sessionConfig));
app.use(rateLimit(config.rateLimitConfig));
app.use('/', routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Cleanup mechanism: Remove all session files on server start
let sessionCleanupMsg = "";
const sessionsDir = './sessions';
if (fs.existsSync(sessionsDir)) {
  try {
    const files = fs.readdirSync(sessionsDir);
    for (const file of files) {
      fs.unlinkSync(`${sessionsDir}/${file}`);
    }
    sessionCleanupMsg = "INFO: All session files have been cleared.";
  } catch (err) {
    sessionCleanupMsg = "ERROR: Could not clear session files: " + err;
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("\n========================================================================");
  console.log(`ENGINE X v3 - Lite edition running on port ${PORT}`);
  if (sessionCleanupMsg) {
    console.log(sessionCleanupMsg);
  }
  console.log(`INFO: ${config.AUTH_METHOD} authentication enabled.`);
  if (config.PASSIVE_MODE_ENABLED) {
    console.warn("WARNING: Passive Mode is enabled. All traffic is redirected to BOT_URL.");
  }
  if (config.TEST_MODE_ENABLED) {
    console.warn("WARNING: Test Mode is enabled. Antibot mechanism is turned off.");
  }
  console.log("========================================================================\n");
});
