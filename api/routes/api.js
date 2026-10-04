const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const machineController = require('../controllers/machineController');
const bookingController = require('../controllers/bookingController');
const notificationController = require('../controllers/notificationController');

// Auth Routes
router.post('/auth/login', authController.login);

// Machine Routes
router.get('/machines', machineController.getAllMachines);
router.get('/machines/:id', machineController.getMachineById);
router.put('/machines/:id/status', machineController.updateMachineStatus);

// Booking Routes
router.post('/bookings', bookingController.createBooking);
router.get('/bookings/all', bookingController.getAllBookings);
router.put('/bookings/:id/cancel', bookingController.cancelBooking);
router.get('/bookings/user/:userId/active', bookingController.getUserActiveBooking);

// Notification Routes (Email Reminders)
router.post('/notifications/test-email', notificationController.testEmail);
router.post('/notifications/trigger-reminders', notificationController.triggerReminders);

module.exports = router;
