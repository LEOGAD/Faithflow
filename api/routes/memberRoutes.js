const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

router.post('/create', memberController.createMember);
router.get('/list', memberController.listMembers);
router.put('/update/:id', memberController.updateMember);
router.delete('/delete/:id', memberController.deleteMember);

module.exports = router;
