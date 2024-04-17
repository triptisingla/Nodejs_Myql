/** @format */

const { User } = require("@models");

const createUser = async (req, res) => {
  // Creates a new user into Users table
  // Creates a new user into Users table
  const { firstName, lastName } = req.body;
  try {
    await User.create({
      firstName,
      lastName,
    });
    return res.send({
      status: 200,
      message: `New user: ${firstName} ${lastName} has been created`,
    });
  } catch (error) {
    return;
  }
};

const findAllUsers = async (req, res) => {
  // fetch all the users from the database
  try {
    const data = await User.findAll();

    return res.send({ status: 200, data });
  } catch (error) {
    return res.send({ status: 404, data: error.message });
  }
};

module.exports = { createUser, findAllUsers };
