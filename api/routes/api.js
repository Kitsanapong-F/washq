const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const machineController = require('../controllers/machineController');
const bookingController = require('../controllers/bookingController');

// Auth Routes
router.post('/auth/login', authController.login);

// Machines Routes
router.get('/machines', machineController.getAllMachines);
router.put('/machines/:id/status', machineController.updateMachineStatus);

// Bookings Routes
router.post('/bookings', bookingController.createBooking);
router.get('/bookings/all', bookingController.getAllBookings);

module.exports = router;
