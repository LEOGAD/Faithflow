const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/weekly', reportController.getWeeklyReport);
router.get('/monthly', reportController.getMonthlyReport);
router.get('/available-periods', reportController.getAvailablePeriods);
router.post('/generate', reportController.generateCustomReport);
router.post('/generate-pdf', reportController.generatePdf);

module.exports = router;
