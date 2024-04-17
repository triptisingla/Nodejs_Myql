/** @format */

const { Book } = require("@models");

const save = async (req, res) => {
  // Saves book into the database.
  const { title, author, description } = req.body;
  try {
    await Book.create({
      title,
      author,
      description,
    });
    return res.json({
      status: 200,
      message: `New book ${title} by ${author} successfully added! `,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: error.message,
    });
  }
};

const findAllBooks = async (req, res) => {
  // Fetch all books from books table
  try {
    const data = await Book.findAll();

    return res.send({ status: 200, data });
  } catch (error) {
    return res.send({ status: 404, data: error.message });
  }
};

module.exports = { save, findAllBooks };
