const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function countryCodeToFlagEmoji(countryCode) {
    return countryCode
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
}

async function getVisitorInfo(ip) {
    try {
        const res = await axios.get(`http://ip-api.com/json/${ip}`);
        const data = res.data;
        if (data && data.status === 'success') {
            const country = data.country;
            const flag = countryCodeToFlagEmoji(data.countryCode);
            return { country, flag };
        }
    } catch (error) {
        console.error('Error in IP lookup:', error);
    }
    return { country: 'Unknown', flag: '' };
}

function getClientIp(req) {
    if (req.headers['cf-connecting-ip']) {
        return req.headers['cf-connecting-ip'];
    }
    if (req.headers['x-forwarded-for']) {
        const ips = req.headers['x-forwarded-for'].split(',');
        return ips[0].trim();
    }
    return req.connection?.remoteAddress || req.ip;
}

async function sendTelegramNotification(message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('Error sending Telegram notification:', error.message);
    }
}

module.exports = {
    sendTelegramNotification,
    getVisitorInfo,
    getClientIp,
    countryCodeToFlagEmoji
};
