/** @format */

// controllers/loanController.js

const { Customer, Loan } = require("@models");

// Create a new loan for a customer
exports.createLoan = async (req, res) => {
  try {
    const {
      customer_id,
      loan_amount,
      tenure,
      interest_rate, } = req.body;
    const customer = await Customer.findByPk(customer_id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    let approval = true;
    const loans = await Loan.findAll({
      where: { customer_id },
      include: Customer
    });

    let monthly_repayment = 0;
    if (loans.length == 0) {
      if (loan_amount > customer.monthly_salary * 0.5)
        return res.status(201).json({ customer_id, loan_approved: false, message: "Your loan was not approved" });
      monthly_repayment = calculateMonthlyPayment(loan_amount, interest_rate, tenure);
      return createAndRespond(customer_id, loan_amount, tenure, interest_rate, res, monthly_repayment);
    }

    const score = calculateCreditScore(loans, customer);
    const totalEMIs = calculateTotalEMIs(loans);
    if (totalEMIs > customer.monthly_salary * 0.5) {
      approval = false;
    }

    // Decision making logic
    if (score > 50) {
      monthly_repayment = calculateMonthlyPayment(loan_amount, interest_rate, tenure);
      approval = true
    } else {
      const response = determineLoanConditions(score, loan_amount, interest_rate, tenure);
      approval = response.approval;
      monthly_repayment = response.monthly_installment
    }
    if (approval) {
      return createAndRespond(customer_id, loan_amount, tenure, interest_rate, res, monthly_repayment);
    }
    else {
      return res.status(201).json({ customer_id, loan_approved: false, message: "Your loan was not approved" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

async function createAndRespond(customer_id, loan_amount, tenure, interest_rate, res, monthly_repayment) {
  const loan = await Loan.create({
    loan_amount,
    tenure,
    interest_rate,
    monthly_repayment,
    start_date: new Date(),
    customer_id,
    remaining_principal: loan_amount
  });

  const totalRepayment = monthly_repayment * tenure;
  // Update customer's current debt
  const customer = await Customer.findByPk(customer_id);
  customer.current_debt = (customer.current_debt || 0) + totalRepayment;
  await customer.save();

  return res.status(201).json({ loan_id: loan.loan_id, customer_id, loan_approved: true, monthly_installment: monthly_repayment });
}
// Get all loans for a customer
exports.getAllLoansForCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.customer_id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const loans = await Loan.findAll({
      where: { customer_id: req.params.customer_id },
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
    const loan = await Loan.findByPk(req.params.loanId, { include: Customer });
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }
    res.status(200).json({ loan_id: loan.loan_id, customer: loan.Customer, loan_amount: loan.loan_amount, interest_rate: loan.interest_rate, monthly_installment: loan.monthly_repayment, tenure: loan.tenure });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.makePayment = async (req, res) => {
  try {
    const { emi_payment } = req.body;
    if (!emi_payment) {
      return res.status(400).json({ error: "Pay the correct amount!" })
    }
    const loan = await Loan.findByPk(req.params.loanId, { include: Customer });
    if (loan.remaining_principal == 0) {
      return res.status(201).json({ message: "Already repaid the whole amount of the loan!" })
    }
    if (loan.emis_paid_on_time == loan.tenure)
      return res.status(202).json({ message: "Your tenure ended, you are late!" })
    let return_money = 0;
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }


    if (loan.remaining_principal < emi_payment) {
      return_money = emi_payment - loan.remaining_principal;
    }
    // let remainingPrincipal = max(0, (loan.remaining_principal - emi_payment));
    let remainingPrincipal = loan.remaining_principal - emi_payment;
    if (remainingPrincipal < 0)
      remainingPrincipal = 0;

    let end_date = "0000-00-00 00:00:00";
    if (remainingPrincipal == 0)
      end_date = new Date();
    const remainingTenure = loan.tenure - loan.emis_paid_on_time;
    const newEMI = calculateMonthlyPayment(remainingPrincipal, loan.interest_rate, remainingTenure);

    const updatedLoan = await Loan.update(
      {
        remaining_principal: remainingPrincipal,
        monthly_repayment: newEMI,
        emis_paid_on_time: loan.emis_paid_on_time + 1,
        end_date
      },
      { where: { loan_id: req.params.loanId } }
    );
    // Check if the update was successful
    if (updatedLoan[0] === 0) { // Sequelize update returns an array where the first element is the number of affected rows
      return res.status(404).json({ error: "Failed to update the loan" });
    }

    const customer = await Customer.findByPk(loan.customer_id);
    if (customer) {
      customer.current_debt -= emi_payment;
      if (customer.current_debt < 0)
        customer.current_debt = 0;
      await customer.save();
    } else {
      return res.status(404).json({ error: "Customer not found" });
    }
    return res.status(200).json({ message: "EMI payment updated successfully", new_emi: newEMI, "Money Returned": return_money });
  } catch (error) {
    res.status(500).json({ error: "Failed to update EMI payment" });
  }
};

// Delete a loan by ID
exports.deleteLoan = async (req, res) => {
  try {
    const deletedLoanCount = await Loan.destroy({
      where: { loan_id: req.params.loanId },
    });
    if (deletedLoanCount === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }
    res.status(200).json({ message: "Loan deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete loan" });
  }
};


// Calculate monthly payment
function calculateMonthlyPayment(principal, rate, tenure) {
  if (principal == 0)
    return 0.00;
  const monthlyRate = rate / 1200;
  const payment = principal * monthlyRate / (1 - (Math.pow(1 / (1 + monthlyRate), tenure)));
  return parseFloat(payment.toFixed(2));
}

// Calculate credit score
function calculateCreditScore(loans, customer) {
  let score = 100;
  const currentYear = new Date().getFullYear();

  const timelyPaymentsRatio = loans.reduce((acc, loan) => acc + (loan.emis_paid_on_time / loan.tenure), 0) / loans.length;
  score += timelyPaymentsRatio * 10;

  const totalLoans = loans.length;
  score -= (totalLoans > 5 ? 10 : 0);

  const currentYearLoans = loans.filter(loan => new Date(loan.start_date).getFullYear() === currentYear).length;
  score += (currentYearLoans > 3 ? -10 : 5);

  const totalApprovedAmount = loans.reduce((acc, loan) => acc + loan.loan_amount, 0);
  if (totalApprovedAmount > customer.approved_limit) {
    score = 0;
  } else {
    score += (totalApprovedAmount > 500000 ? 15 : 5);
  }

  return Math.min(Math.max(Math.round(score), 0), 100);
}

// Calculate total EMIs
function calculateTotalEMIs(loans) {
  return loans.reduce((acc, loan) => acc + loan.monthly_repayment, 0);
}

// Main exported function
exports.check_eligibility = async (req, res) => {
  try {
    const { customer_id, loan_amount, interest_rate, tenure } = req.body;

    if (!customer_id) {
      return res.status(400).json({ error: "Customer ID is required" });
    }
    const loans = await Loan.findAll({
      where: { customer_id },
      include: Customer
    });

    if (!loans.length) {
      const monthly_installment = calculateMonthlyPayment(loan_amount, interest_rate, tenure);
      return res.status(200).json({ customer_id, approval: true, interest_rate, corrected_interest_rate: interest_rate, tenure, monthly_installment });
    }

    const customer = loans[0].Customer;
    const score = calculateCreditScore(loans, customer);
    const totalEMIs = calculateTotalEMIs(loans);

    if (totalEMIs > customer.monthly_salary * 0.5) {
      return res.status(200).json({ customer_id, approval: false, interest_rate, corrected_interest_rate: 0, tenure: 0, monthly_installment: 0 });
    }

    // Decision making logic
    if (score > 50) {
      const monthly_installment = calculateMonthlyPayment(loan_amount, interest_rate, tenure);
      return res.status(200).json({ customer_id, approval: true, interest_rate, corrected_interest_rate: interest_rate, tenure, monthly_installment });
    } else {
      return res.status(200).json(determineLoanConditions(score, loan_amount, interest_rate, tenure));
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to get loan" });
  }
};

// Determine loan conditions based on the credit score
function determineLoanConditions(score, loan_amount, interest_rate, tenure) {
  let corrected_interest_rate = interest_rate;
  if (score > 30) corrected_interest_rate = Math.max(12, interest_rate);
  else if (score > 10) corrected_interest_rate = Math.max(16, interest_rate);
  else corrected_interest_rate = 0;

  const monthly_installment = calculateMonthlyPayment(loan_amount, corrected_interest_rate, tenure);
  return {
    approval: score > 10,
    interest_rate,
    corrected_interest_rate,
    tenure,
    monthly_installment
  };
}

function calculateRemainingEMIs(remainingPrincipal, monthlyRepayment, interestRate) {
  let emiCount = 0;

  // Convert annual interest rate to monthly and percentage to decimal
  const monthlyRate = interestRate / 1200;

  while (remainingPrincipal > 0) {
    const monthlyInterest = remainingPrincipal * monthlyRate;

    const principalRepayment = monthlyRepayment - monthlyInterest;

    remainingPrincipal -= principalRepayment;

    emiCount++;

    if (remainingPrincipal <= 0) {
      break;
    }
  }

  return emiCount;
}


exports.viewStatement = async (req, res) => {
  const { customer_id, loan_id } = req.params;

  const loan = await Loan.findByPk(loan_id, { include: Customer });

  if (!loan) {
    return res.status(404).json({ error: "Loan not found" });
  }

  if (loan.customer_id != customer_id)
    return res.status(500).json({ message: "You have not taken this loan so, you are not allowed to view this!!" })

  const amount_paid = loan.remaining_principal;
  const repayments_left = calculateRemainingEMIs(loan.remaining_principal, loan.monthly_repayment, loan.interest_rate)


  return res.status(200).json({ principal: loan.loan_amount, interest_rate: loan.interest_rate, amount_paid, monthly_installment: loan.monthly_repayment, repayments_left })
}