const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const roleMiddleware = require('../middleware/roleMiddleware');

const allowed = ['treasurer'];

router.post('/create', roleMiddleware(allowed), expenseController.createExpense);
router.get('/list', roleMiddleware(allowed), expenseController.listExpenses);
router.put('/update/:id', roleMiddleware(allowed), expenseController.updateExpense);
router.delete('/delete/:id', roleMiddleware(allowed), expenseController.deleteExpense);

module.exports = router;
