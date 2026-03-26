const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const validateTrade   = require('../middleware/validateTrade');

// POST /api/trades/portfolio/:username/trade — Execute a new trade (with input validation)
router.post('/portfolio/:username/trade', validateTrade, tradeController.executeTrade);

// PUT /api/trades/portfolio/:username/trade/close — Close an open trade + book PnL
router.put('/portfolio/:username/trade/close', tradeController.closeTrade);

// GET /api/trades/stats/:username — Fetch portfolio analytics stats
router.get('/stats/:username', tradeController.getStats);

module.exports = router;
