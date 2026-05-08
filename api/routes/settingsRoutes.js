const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/settingsController');
const roleMiddleware = require('../middleware/roleMiddleware');

const ownerOnly = []; // owner implicitly gets access

// Global settings
router.get('/', roleMiddleware(ownerOnly), ctrl.getSettings);
router.put('/:section', roleMiddleware(ownerOnly), ctrl.updateSettings);
router.post('/upload-logo', roleMiddleware(ownerOnly), ctrl.uploadLogo);

// Services
router.get('/services/list', roleMiddleware(ownerOnly), ctrl.listServices);
router.post('/services/create', roleMiddleware(ownerOnly), ctrl.createService);
router.put('/services/:id', roleMiddleware(ownerOnly), ctrl.updateService);
router.delete('/services/:id', roleMiddleware(ownerOnly), ctrl.deleteService);

// Income Categories
router.get('/income-categories/list', roleMiddleware(ownerOnly), ctrl.listIncomeCategories);
router.post('/income-categories/create', roleMiddleware(ownerOnly), ctrl.createIncomeCategory);
router.put('/income-categories/:id', roleMiddleware(ownerOnly), ctrl.updateIncomeCategory);
router.delete('/income-categories/:id', roleMiddleware(ownerOnly), ctrl.deleteIncomeCategory);

// Expense Categories
router.get('/expense-categories/list', roleMiddleware(ownerOnly), ctrl.listExpenseCategories);
router.post('/expense-categories/create', roleMiddleware(ownerOnly), ctrl.createExpenseCategory);
router.put('/expense-categories/:id', roleMiddleware(ownerOnly), ctrl.updateExpenseCategory);
router.delete('/expense-categories/:id', roleMiddleware(ownerOnly), ctrl.deleteExpenseCategory);

// Users
router.get('/users/list', roleMiddleware(ownerOnly), ctrl.listUsers);
router.post('/users/create', roleMiddleware(ownerOnly), ctrl.createUser);
router.put('/users/:id/role', roleMiddleware(ownerOnly), ctrl.updateUserRole);
router.delete('/users/:id', roleMiddleware(ownerOnly), ctrl.deleteUser);

// Export & Backup
router.get('/export/:collection', roleMiddleware(ownerOnly), ctrl.exportCSV);
router.get('/backup/download', roleMiddleware(ownerOnly), ctrl.downloadBackup);
router.post('/backup/restore', roleMiddleware(ownerOnly), ctrl.restoreBackup);

module.exports = router;
