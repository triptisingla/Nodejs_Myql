'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Customers', {
      customer_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      first_name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      last_name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      phone_number: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      age: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      monthly_salary: {
        type: Sequelize.INTEGER, // or DataTypes.INTEGER
        allowNull: false
      },
      approved_limit: {
        type: Sequelize.INTEGER, // or DataTypes.INTEGER
        allowNull: false
      },
      current_debt: {
        type: Sequelize.INTEGER, // or DataTypes.INTEGER
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Customers');
  }
};