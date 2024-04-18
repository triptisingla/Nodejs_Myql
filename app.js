require("module-alias/register");
const port = process.env.PORT || 3000;
const express = require("express");
const { json } = require("express");
const customerRoutes = require("@routes/customerRoutes");
const loanRoutes = require("@routes/loanRoutes");
const dataRoutes = require("@routes/dataRoutes");

const cors = require("cors");
const app = express();

app.use(json());
app.use(cors());

// Customer routes
app.use('/customers', customerRoutes);

// Loan routes
app.use('/customers', loanRoutes);
app.use('/data', dataRoutes);

app.listen(port, () =>
  console.log(`Server is up and running on PORT: ${port}`)
);