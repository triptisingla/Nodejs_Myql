// routes/loanRoutes.js

const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

router.post('/ingest', dataController.ingestData);

module.exports = router;
