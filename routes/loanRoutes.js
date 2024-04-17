// routes/loanRoutes.js

const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

router.post('/:customerId/loans', loanController.createLoan);
router.get('/:customerId/loans', loanController.getAllLoansForCustomer);
router.get('/loans/:loanId', loanController.getLoanById);
router.put('/loans/:loanId', loanController.updateLoan);
router.delete('/loans/:loanId', loanController.deleteLoan);
router.post('/loans/check_eligibilty', loanController.check_eligibility);

module.exports = router;
