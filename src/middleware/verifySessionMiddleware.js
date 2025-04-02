// middleware/verifySessionMiddleware.js
function verifySessionMiddleware(req, res, next) {
    if (!req.session || (!req.session.token && !req.session.keynotes)) {
        return res.status(403).send('Access denied: Invalid session.');
    }
    next();
}

module.exports = { verifySessionMiddleware };
