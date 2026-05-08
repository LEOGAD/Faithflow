const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const roleMiddleware = require('../middleware/roleMiddleware');

const allowed = ['attendance_admin'];

router.post('/create', roleMiddleware(allowed), attendanceController.createAttendance);
router.get('/list', roleMiddleware(allowed), attendanceController.listAttendance);
router.put('/update/:id', roleMiddleware(allowed), attendanceController.updateAttendance);
router.delete('/delete/:id', roleMiddleware(allowed), attendanceController.deleteAttendance);

module.exports = router;
