// routes/loanRoutes.js

const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

router.post('/:customer_id/loans', loanController.createLoan);
router.get('/:customer_id/loans', loanController.getAllLoansForCustomer);
router.get('/loans/view-loan/:loanId', loanController.getLoanById);
router.get('/loans/view-statement/:customer_id/:loan_id', loanController.viewStatement);
router.put('/loans/make-payment/:loanId', loanController.updateLoan);
router.delete('/loans/:loanId', loanController.deleteLoan);
router.post('/loans/check_eligibilty', loanController.check_eligibility);

module.exports = router;
