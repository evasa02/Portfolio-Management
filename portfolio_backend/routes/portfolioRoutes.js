const express = require('express');
const router = express.Router();
const controller = require('../controllers/portfolioController');

router.get('/portfolio', controller.getPortfolio);
router.post('/buy', controller.buyStock);
router.post('/sell', controller.sellStock);
router.get('/transactions', controller.getTransactions);
router.get('/analytics', controller.getAnalytics);

module.exports = router;