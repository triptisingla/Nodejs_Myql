'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Customer.hasMany(models.Loan, {
        foreignKey: "customer_id"
      });
    }
  }
  Customer.init({
    customer_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    phone_number: DataTypes.INTEGER,
    age: DataTypes.INTEGER,
    monthly_salary: DataTypes.INTEGER,
    approved_limit: DataTypes.INTEGER,
    current_debt: DataTypes.INTEGER,
    // email: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Customer',
  });
  // Customer.addHook('beforeCreate', (customer, options) => {
  //   // If customer_id is provided, use it, otherwise let Sequelize auto-generate it
  //   if (!customer.customer_id) {
  //     delete customer.customer_id; // Ensure that customer_id is not provided to let Sequelize auto-generate it
  //   }
  // });
  return Customer;
};