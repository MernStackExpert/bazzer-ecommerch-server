const express = require('express');
const router = express.Router();

const { 
  getAllProducts, 
  getProductById, 
  getSellerProducts,
  addProduct, 
  updateProduct, 
  deleteProduct, 
  updateProductAnalytics 
} = require('../controllers/products.controller');

router.get('/', getAllProducts);
router.get('/:id', getProductById);

router.patch('/analytics/:id', updateProductAnalytics);
router.get('/seller/:sellerId', getSellerProducts);
router.post('/add', addProduct); 
router.patch('/update/:id', updateProduct); 
router.delete('/delete/:id', deleteProduct);

module.exports = router;