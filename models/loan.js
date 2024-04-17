'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Loan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Loan.belongsTo(models.Customer, { foreignKey: 'customer_id' });
    }
  }
  Loan.init({
    loan_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    loan_amount: DataTypes.INTEGER,
    tenure: DataTypes.INTEGER,
    interest_rate: DataTypes.FLOAT,
    monthly_repayment: DataTypes.INTEGER,
    emis_paid_on_time: DataTypes.INTEGER,
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    // loan_amount: DataTypes.FLOAT,
    // status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Loan',
  });
  Loan.addHook('beforeCreate', (loan, options) => {
    // If loan_id is provided, use it, otherwise let Sequelize auto-generate it
    if (!loan.loan_id) {
      delete loan.loan_id; // Ensure that customer_id is not provided to let Sequelize auto-generate it
    }
  });
  return Loan;
};