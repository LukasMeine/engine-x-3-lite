const crypto = require('crypto');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
dotenv.config();

const tokenStore = new Map();
const TOKEN_CLEANUP_INTERVAL = 1 * 60 * 1000;

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_FILE_KEY = process.env.S3_FILE_KEY;
const AWS_REGION = process.env.AWS_REGION;
const s3Client = new S3Client({ region: AWS_REGION });

const streamToString = (stream) =>
    new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });

setInterval(() => {
    const now = Date.now();
    for (const [token, data] of tokenStore.entries()) {
        if (data.expires < now) tokenStore.delete(token);
    }
}, TOKEN_CLEANUP_INTERVAL);

async function fetchTokenDataFromS3(token) {
    try {
        const params = { Bucket: S3_BUCKET_NAME, Key: S3_FILE_KEY };
        const command = new GetObjectCommand(params);
        const data = await s3Client.send(command);
        const bodyContents = await streamToString(data.Body);
        const json = JSON.parse(bodyContents);
        return json.find(item => item.token === token) || null;
    } catch (error) {
        console.error('Error fetching token data from S3:', error);
        return null;
    }
}

async function processTokenLookup(token) {
    const s3TokenData = await fetchTokenDataFromS3(token);
    if (!s3TokenData) throw new Error('Token not found in S3');
    return s3TokenData.base64;
}

function generateToken(destination, expiresIn = 3600000) {
    const token = crypto.randomBytes(16).toString('hex');
    tokenStore.set(token, {
        destination,
        expires: Date.now() + Math.min(expiresIn, 24 * 60 * 60 * 1000),
        used: false,
        created: Date.now(),
        attempts: 0
    });
    return token;
}

function generateTokenController(req, res) {
    const { url, expiresIn } = req.body;
    if (!url) return res.status(400).json({ error: 'Invalid URL' });
    const token = generateToken(url, expiresIn);
    res.json({ token, redirectUrl: `/r/${token}` });
}

function validateToken(token) {
    const tokenData = tokenStore.get(token);
    if (!tokenData || tokenData.expires < Date.now()) return false;
    return true;
}

function redirectHandler(req, res) {
    const { token, id } = req.params;
    req.session.redirectData = "";
    req.session.nextStep = 2;
    req.session.token = token;
    if (typeof id !== 'undefined') {
        try {
            req.session.redirectData = id;
            return res.redirect(`/process?token=${token}&id=${id}`);
        } catch (error) {
            return res.status(400).send('Invalid Base64 encoding.');
        }
    }
    return res.redirect(`/confirm?token=${token}`);
}

module.exports = {
    generateTokenController,
    generateToken,
    validateToken,
    processTokenLookup,
    redirectHandler,
    s3Client,
    streamToString
};
