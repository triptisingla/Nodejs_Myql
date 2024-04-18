// routes/customerRoutes.js

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.post('/register', customerController.createCustomer);
router.get('/', customerController.getAllCustomers);
router.get('/:customerId', customerController.getCustomerById);
router.put('/:customerId', customerController.updateCustomer);
router.delete('/:customerId', customerController.deleteCustomer);
router.get('/getloans/:customerId',customerController.getAllLoansForCustomer);

module.exports = router;
