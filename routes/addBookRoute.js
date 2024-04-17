const express = require("express");
const { save, findAllBooks } = require("@controllers/BookController");
const { createUser, findAllUsers } = require("@controllers/UserController");
const {
  assignBook,
  returnBook,
  fetchAssignedBooks,
} = require("@controllers/ReaderController");
const route = express.Router();

// Add Book & Get all books Routes
route.post("/add-book", save);
route.get("/inventory", findAllBooks);

// Assign Book and Return Book Routes
route.post("/assign-book", assignBook);
route.post("/return-book", returnBook);
route.get("/assigned-books", fetchAssignedBooks);

// Add User and Get User Routes
route.post("/add-user", createUser);
route.get("/get-users", findAllUsers);

module.exports = route;