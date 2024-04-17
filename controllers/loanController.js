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

    // const { customer_id, loan_amount, interest_rate, tenure } = req.body;
    let approval = true;
    const loans = await Loan.findAll({
      where: { customer_id },
      include: Customer
    });
    console.log(loans.length);
    let monthly_repayment = 0;
    if (loans.length == 0) {
      monthly_repayment = calculateMonthlyPayment(loan_amount, interest_rate, tenure);
      const loan = await Loan.create({
        loan_amount,
        tenure,
        interest_rate,
        monthly_repayment,
        start_date: new Date(),
        customer_id
      });
      return res.status(201).json({ loan_id: loan.loan_id, customer_id, loan_approved: true, monthly_installment: loan.monthly_repayment })
    }

    const customer = loans[0].Customer;
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
    // console.log(req.params.customerId, amount, status);
    if (approval) {
      const loan = await Loan.create({
        loan_amount,
        tenure,
        interest_rate,
        monthly_repayment,
        start_date: new Date(),
        customer_id
      });
      return res.status(201).json({ loan_id: loan.loan_id, customer_id, loan_approved: true, monthly_installment: loan.monthly_repayment });
    }
    else {
      return res.status(201).json({ customer_id, loan_approved: false, message: "Your loan was not approved" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get all loans for a customer
exports.getAllLoansForCustomer = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      where: { customer_id: req.params.customerId },
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
    // console.log("id : ", req.params.loanId)
    const loan = await Loan.findByPk(req.params.loanId, { include: Customer });
    // console.log(loan);
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }
    res.status(200).json({ loan_id: loan.loan_id, customer: loan.Customer, loan_amount: loan.loan_amount, interest_rate: loan.interest_rate, monthly_installment: loan.monthly_repayment, tenure: loan.tenure });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a loan by ID
exports.updateLoan = async (req, res) => {
  try {
    const { loan_amount,
      tenure,
      interest_rate,
      monthly_repayment,
      emis_paid_on_time,
      start_date,
      end_date,
      customer_id } = req.body;
    const updatedLoan = await Loan.update(
      {
        loan_amount,
        tenure,
        interest_rate,
        monthly_repayment,
        emis_paid_on_time,
        start_date,
        end_date,
        customer_id
      },
      { where: { loan_id: req.params.loanId }, include: Customer },
    );
    if (updatedLoan[0] === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }
    res.status(200).json({ data: updatedLoan, message: "Loan updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update loan" });
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

// function calculateMonthlyPayment(principal, annualInterestRate, tenureYears) {
//   const monthlyInterestRate = annualInterestRate / 100 / 12; // Convert annual rate to a monthly and percentage to a decimal
//   const totalPayments = tenureYears * 12; // Total number of monthly payments

//   const monthlyPayment = principal * monthlyInterestRate * (Math.pow(1 + monthlyInterestRate, totalPayments)) / (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);

//   return monthlyPayment.toFixed(2); // Rounds to two decimal places
// }

// exports.check_eligibility = async (req, res) => {
//   try {
//     const { customer_id,
//       loan_amount,
//       interest_rate,
//       tenure } = req.body;
//     // console.log("here");
//     // console.log("customer id is: ", customer_id)



//     const loans = await Loan.findAll({ where: { customer_id }, include: Customer });
//     if (loans.length == 0) {
//       const monthly_installment = calculateMonthlyPayment(loan_amount, interest_rate, tenure);
//       return res.status(200).json({ customer_id, approval: true, interest_rate, corrected_interest_rate: interest_rate, tenure, monthly_installment });
//     }
//     const customer = loans[0].Customer;



//     const currentYear = new Date().getFullYear();
//     let score = 100;

//     // Component 1: Timely EMIs
//     const timelyPaymentsRatio = loans.reduce((acc, loan) => acc + (loan.emis_paid_on_time / loan.tenure), 0) / loans.length;
//     score += timelyPaymentsRatio * 10;

//     // Component 2: Number of loans
//     const totalLoans = loans.length;
//     score -= (totalLoans > 5 ? 10 : 0); // Subtract points if customer seems to rely too heavily on credit

//     // Component 3: Loan activity in the current year
//     const currentYearLoans = loans.filter(loan => new Date(loan.start_date).getFullYear() === currentYear).length;
//     score += (currentYearLoans > 3 ? -10 : 5); // Penalize for too many new loans, reward for moderate activity

//     // Component 4: Loan approved volume
//     const totalApprovedAmount = loans.reduce((acc, loan) => acc + loan.loan_amount, 0);
//     if (totalApprovedAmount > customer.approved_limit) {
//       score = 0; // If approved volume exceeds the limit, set score to 0
//     } else {
//       score += (totalApprovedAmount > 500000 ? 15 : 5); // Increase score more for higher approved amounts within limits
//     }

//     // Normalize score to be out of 100 and not fractional
//     score = Math.min(Math.max(Math.round(score), 0), 100);

//     const totalEMIs = loans.reduce((acc, loan) => acc + (loan.monthly_repayment), 0);
//     if (totalEMIs > customer.monthly_salary * 0.5) {
//       return res.status(200).json({ customer_id, approval: false, interest_rate, corrected_interest_rate: 0, tenure: 0, monthly_installment: 0 });
//     }
//     else if (score > 50) {
//       const monthly_installment = calculateMonthlyPayment(loan_amount, interest_rate, tenure);
//       return res.status(200).json({ customer_id, approval: true, interest_rate, corrected_interest_rate: interest_rate, tenure, monthly_installment });
//     } else if (score > 30) {
//       if (interest_rate > 12) {
//         const monthly_installment = calculateMonthlyPayment(loan_amount, interest_rate, tenure);
//         return res.status(200).json({ customer_id, approval: true, interest_rate, corrected_interest_rate: interest_rate, tenure, monthly_installment });
//       }
//       else {
//         const monthly_installment = calculateMonthlyPayment(loan_amount, 12, tenure);
//         return res.status(200).json({ customer_id, approval: false, interest_rate, corrected_interest_rate: 12, tenure, monthly_installment });
//       }

//     } else if (score > 10) {
//       if (interest_rate > 16) {
//         const monthly_installment = calculateMonthlyPayment(loan_amount, interest_rate, tenure);
//         return res.status(200).json({ customer_id, approval: true, interest_rate, corrected_interest_rate: interest_rate, tenure, monthly_installment });
//       }
//       else {
//         const monthly_installment = calculateMonthlyPayment(loan_amount, 16, tenure);
//         return res.status(200).json({ customer_id, approval: false, interest_rate, corrected_interest_rate: 16, tenure, monthly_installment });
//       }
//     } else {
//       return res.status(200).json({ customer_id, approval: false, interest_rate, corrected_interest_rate: 0, tenure: 0, monthly_installment: 0 });

//     }

//   } catch (error) {
//     res.status(500).json({ error: "Failed to get loan" });
//   }
// }

// Calculate monthly payment
function calculateMonthlyPayment(principal, rate, tenure) {
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

