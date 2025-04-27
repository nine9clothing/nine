const express = require('express');
const { createProduct, getAllProducts, updateProduct, deleteProduct } = require('../controllers/productController');
const router = express.Router();

// Route to create a new product
router.post('/create', createProduct);

// Route to get all products
router.get('/', getAllProducts);

// Route to update a product
router.put('/update', updateProduct);

// Route to delete a product
router.delete('/:id', deleteProduct);

module.exports = router;
