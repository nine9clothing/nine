const express = require('express');
const { createOrder, getUserOrders } = require('../controllers/orderController');
const router = express.Router();

router.post('/create', createOrder);

router.get('/:userId', getUserOrders);

module.exports = router;
