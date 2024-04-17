'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Assign extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Assign.belongsTo(models.Book);
      Assign.belongsTo(models.User);
    }
  }
  Assign.init({
    bookId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "books",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    returnStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defalutValue: false,
    },
  }, {
    sequelize,
    modelName: 'Assign',
  });
  return Assign;
};