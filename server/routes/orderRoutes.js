const express = require('express');
const { createOrder, getUserOrders } = require('../controllers/orderController');
const router = express.Router();

// Route to create a new order
router.post('/create', createOrder);

// Route to get all orders for a user
router.get('/:userId', getUserOrders);

module.exports = router;
