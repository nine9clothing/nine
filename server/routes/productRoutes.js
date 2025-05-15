const express = require('express');
const { createProduct, getAllProducts, updateProduct, deleteProduct } = require('../controllers/productController');
const router = express.Router();

router.post('/create', createProduct);

router.get('/', getAllProducts);

router.put('/update', updateProduct);

router.delete('/:id', deleteProduct);

module.exports = router;
