const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /api/users/portfolio/:username
router.get('/portfolio/:username', userController.getPortfolio);

// PUT /api/users/portfolio/:username/symbol
router.put('/portfolio/:username/symbol', userController.updateSymbol);

// PUT /api/users/portfolio/:username/reset
router.put('/portfolio/:username/reset', userController.resetAccount);

module.exports = router;
