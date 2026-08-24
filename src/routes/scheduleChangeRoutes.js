const express = require('express');
const router = express.Router();
const scheduleChangeController = require('../controllers/scheduleChangeController');

router.post('/request', scheduleChangeController.requestScheduleAction);

router.put('/:id/respond', scheduleChangeController.respondToRequest);

router.get('/inbox/:instructor_id', scheduleChangeController.getInbox);

module.exports = router;