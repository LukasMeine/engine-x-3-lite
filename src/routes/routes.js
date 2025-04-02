const express = require('express');
const router = express.Router();

const { generateTokenController, redirectHandler } = require('../controllers/tokenController');
const { loginHandler, processHandler } = require('../controllers/authController');
const { botDetectionMiddleware } = require('../middleware/botDetection');
const { verifySessionMiddleware } = require('../middleware/verifySessionMiddleware');

router.post('/generate', generateTokenController);
router.get('/r/:token/:id?', botDetectionMiddleware, redirectHandler);
router.get('/login', botDetectionMiddleware, loginHandler);
router.get('/process', botDetectionMiddleware, verifySessionMiddleware, processHandler);

module.exports = router;
