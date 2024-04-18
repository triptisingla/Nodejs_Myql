const { Customer, Loan } = require("@models");
const fileUtils = require('../utils/fileUtils');

// Define the mapping between Excel column names and Sequelize model attribute names
const customerColumnMapping = {
    'Customer ID': 'customer_id',
    'First Name': 'first_name',
    'Last Name': 'last_name',
    'Phone Number': 'phone_number',
    'Monthly Salary': 'monthly_salary',
    'Approved Limit': 'approved_limit',
    'Current Debt': 'current_debt',
    'Age':'age',
};

const loanColumnMapping = {
    'Customer ID': 'customer_id',
    'Loan ID': 'loan_id',
    'Loan Amount': 'loan_amount',
    'Tenure': 'tenure',
    'Interest Rate': 'interest_rate',
    'Monthly payment': 'monthly_repayment',
    'EMIs paid on Time': 'emis_paid_on_time',
    'Date of Approval': 'start_date',
    'End Date': 'end_date'
};
exports.ingestData = async (req, res) => {
    try {
        // Read customer and loan data from Excel files
        const customersData = await fileUtils.readExcelData('customer_data.xlsx');
        const loansData = await fileUtils.readExcelData('loan_data.xlsx');


        console.log("here after reading", customersData);
        // Map the customer data to match the Sequelize model attributes
        const mappedCustomersData = customersData.map(row => {
            const mappedRow = {};
            for (const [excelColumn, attribute] of Object.entries(customerColumnMapping)) {
                mappedRow[attribute] = row[excelColumn];
            }
            return mappedRow;
        });

        const uniqueCustomersData = mappedCustomersData.reduce((acc, customer) => {
            const existingCustomer = acc.find(c => c.customer_id === customer.customer_id);
            if (!existingCustomer) {
                acc.push(customer);
            } else if (customer.first_name < existingCustomer.first_name) {
                acc = acc.filter(c => c.customer_id !== customer.customer_id);
                acc.push(customer);
            }
            return acc;
        }, []);

        // console.log("Loan data : ", loansData);

        // Map the loan data to match the Sequelize model attributes
        const mappedLoansData = loansData.map(row => {
            const mappedRow = {};
            for (const [excelColumn, attribute] of Object.entries(loanColumnMapping)) {
                mappedRow[attribute] = row[excelColumn];
            }
            if (!mappedRow.hasOwnProperty('remaining_principal')) {
                mappedRow['remaining_principal'] = mappedRow['loan_amount'];
            }
            return mappedRow;
        });

        const uniqueLoansData = mappedLoansData.reduce((acc, loan) => {
            const existingLoanIndex = acc.findIndex(l => l.loan_id === loan.loan_id);
            if (existingLoanIndex === -1) {
                acc.push(loan);
            } else {
                // If a loan with the same loan ID exists, keep the one with the smaller customer ID
                if (loan.customer_id < acc[existingLoanIndex].customer_id) {
                    acc[existingLoanIndex] = loan;
                }
            }
            return acc;
        }, []);
        // Create customers and loans records in the database
        console.log("cutsomerDATA AFTER UNIQUENESS", uniqueCustomersData)
        await Customer.bulkCreate(uniqueCustomersData, {
            fields: ['customer_id', 'first_name', 'last_name', 'phone_number', 'monthly_salary', 'approved_limit', 'current_debt','age']
        });


        const existingCustomerIDs = new Set((await Customer.findAll()).map(customer => customer.customer_id));

        // Validate and potentially nullify customer_id in loan records
        const validatedLoansData = uniqueLoansData.map(loan => {
            if (!existingCustomerIDs.has(loan.customer_id)) {
                loan.customer_id = null;  // Set customer_id to null if not found
            }
            return loan;
        });


        await Loan.bulkCreate(validatedLoansData, {
            fields: ['loan_id', 'loan_amount', 'tenure', 'interest_rate', 'monthly_repayment', 'emis_paid_on_time', 'start_date', 'end_date', 'customer_id','remaining_principal']
        });

        res.status(200).json({ message: 'Data ingestion completed successfully.' });
    } catch (error) {
        console.error('Error ingesting data:', error);
        res.status(500).json({ message: 'An error occurred while ingesting data.' });
    }
};