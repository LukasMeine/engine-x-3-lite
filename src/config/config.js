const session = require('express-session');
const FileStore = require('session-file-store')(session);

module.exports = {
    DEFAULT_REDIRECT_URL: process.env.DEFAULT_REDIRECT_URL || 'https://example.com/',
    PASSIVE_MODE_ENABLED: process.env.PASSIVE_MODE ? JSON.parse(process.env.PASSIVE_MODE.toLowerCase()) : false,
    TEST_MODE_ENABLED: process.env.TEST_MODE ? JSON.parse(process.env.TEST_MODE.toLowerCase()) : false,
    BOT_URL: process.env.BOT_URL || 'https://you-are-a-bot.com',
    OS_URLS: {
        windows: process.env.WINDOWS_URL || 'https://windowsurl',
        mac: process.env.MACOS_URL || 'https://mac-url',
        android: process.env.ANDROID_URL || 'https://androidURL',
        ios: process.env.IOS_URL || 'https://ios-url',
        others: process.env.OTHERS_URL || 'https://othersURL'
    },
    SESSION_SECRET: process.env.SESSION_SECRET || 'your-secret-key',
    APP_BASE64_ENABLED: process.env.APP_Base64 && process.env.APP_Base64.toLowerCase() === 'true',
    sessionConfig: {
        store: new FileStore({ path: './sessions', logFn: () => {} }),
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: false
    },
    rateLimitConfig: {
        windowMs: 60 * 1000,
        max: 50
    },
    // New properties for Keynotes-based authentication:
    AUTH_METHOD: process.env.AuthMethod || 'Token',
    KEYNOTES: process.env.Keynotes ? JSON.parse(process.env.Keynotes) : [],
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    S3_FILE_KEY: process.env.S3_FILE_KEY
};
