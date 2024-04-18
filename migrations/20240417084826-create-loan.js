/** @format */

"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Loans", {
      loan_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      loan_amount: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      remaining_principal: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      tenure: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      interest_rate: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      monthly_repayment: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      emis_paid_on_time: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      start_date: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      end_date: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "Customers",
          key: "customer_id",
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Loans");
  },
};
