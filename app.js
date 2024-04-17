require("module-alias/register");
const port = process.env.PORT || 3000;
const express = require("express");
const { json } = require("express");
const addBookRoute = require("@routes/addBookRoute");
const customerRoutes = require("@routes/customerRoutes");
const loanRoutes = require("@routes/loanRoutes");
const cors = require("cors");
const app = express();

app.use(json());
app.use(cors());
app.use("/", addBookRoute);
// app.use("/",(req,res)=>{
//     return "hello world";
// })
// Customer routes
app.use('/customers', customerRoutes);

// Loan routes
app.use('/customers', loanRoutes);

app.listen(port, () =>
  console.log(`Server is up and running on PORT: ${port}`)
);