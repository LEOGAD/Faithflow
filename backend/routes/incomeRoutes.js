const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/incomeController');
const roleMiddleware = require('../middleware/roleMiddleware');

const allowed = ['treasurer'];

router.post('/create', roleMiddleware(allowed), ctrl.createIncome);
router.get('/list', roleMiddleware(allowed), ctrl.listIncome);
router.put('/update/:id', roleMiddleware(allowed), ctrl.updateIncome);
router.delete('/delete/:id', roleMiddleware(allowed), ctrl.deleteIncome);

module.exports = router;
