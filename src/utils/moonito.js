require('dotenv').config();
const axios = require('axios');

function getRandomDomain() {
    const domains = JSON.parse(process.env.MOONITO_DOMAINS || '[]');
    if (domains.length === 0) {
        throw new Error("MOONITO_DOMAINS is not set or empty.");
    }
    return domains[Math.floor(Math.random() * domains.length)];
}

async function checkIpAddress(ipAddress, userAgent) {
    try {
        const publicKey = process.env.MOONITO_PUBLIC_KEY;
        const secretKey = process.env.MOONITO_SECRET_KEY;
        const domain = getRandomDomain();
        const url = `https://moonito.net/api/v1/analytics?domain=${encodeURIComponent(domain)}&ip=${encodeURIComponent(ipAddress)}&ua=${encodeURIComponent(userAgent)}&events=%2Flogin`;

        const response = await axios.get(url, {
            headers: {
                'X-Public-Key': publicKey,
                'X-Secret-Key': secretKey,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error checking IP address with Moonito API:', error);
        return null;
    }
}

module.exports = { checkIpAddress };
