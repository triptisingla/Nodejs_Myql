/** @format */

// controllers/loanController.js

const { Customer, Loan } = require("@models");

// Create a new loan for a customer
exports.createLoan = async (req, res) => {
  try {
    const { amount, status } = req.body;
    console.log(req.params.customerId, amount, status);
    const loan = await Loan.create({
      amount,
      status,
      CustomerId: req.params.customerId,
    });
    res.status(201).json(loan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all loans for a customer
exports.getAllLoansForCustomer = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      where: { CustomerId: req.params.customerId },
      include: Customer,
    });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch loans" });
  }
};

// Get a single loan by ID
exports.getLoanById = async (req, res) => {
  try {
    console.log("id : ",req.params.loanId)
    const loan = await Loan.findByPk(req.params.loanId, { include: Customer });
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }
    res.json(loan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a loan by ID
exports.updateLoan = async (req, res) => {
  try {
    const { amount, status } = req.body;
    const updatedLoan = await Loan.update(
      { amount, status },
      { where: { id: req.params.loanId } },
    );
    if (updatedLoan[0] === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }
    res.status(200).json({ message: "Loan updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update loan" });
  }
};

// Delete a loan by ID
exports.deleteLoan = async (req, res) => {
  try {
    const deletedLoanCount = await Loan.destroy({
      where: { id: req.params.loanId },
    });
    if (deletedLoanCount === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }
    res.status(200).json({ message: "Loan deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete loan" });
  }
};
