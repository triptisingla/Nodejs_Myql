// controllers/customerController.js

const { Customer, Loan } = require("@models")

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const { first_name,
      last_name,
      phone_number,
      monthly_salary,
      age } = req.body;
    const approved_limit = 36 * monthly_salary
    const customer = await Customer.create({
      first_name,
      last_name,
      phone_number,
      monthly_salary,
      approved_limit,
      current_debt:0,
      age
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Get a single customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

// Update a customer by ID
exports.updateCustomer = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone_number,
      monthly_salary,
      age
    } = req.body;
    let approved_limit;
    if (monthly_salary)
      approved_limit = 36 * monthly_salary

    const updatedCustomer = await Customer.update(
      {
        first_name,
        last_name,
        phone_number,
        monthly_salary,
        age,
        approved_limit
      },
      { where: { customer_id: req.params.customerId } }
    );
    if (updatedCustomer[0] === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// Delete a customer by ID
exports.deleteCustomer = async (req, res) => {
  try {
    const deletedCustomerCount = await Customer.destroy({
      where: { customer_id: req.params.customerId }
    });
    if (deletedCustomerCount === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};

exports.getAllLoansForCustomer = async (req, res) => {
  try {
    // Find the customer by ID
    const customer = await Customer.findByPk(req.params.customerId, {
      include: Loan // Include the associated loans
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Access the associated loans from the customer object
    // const loans = customer.Loans;

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
};