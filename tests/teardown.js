require("dotenv").config();
const mongoose = require("mongoose");

module.exports = async () => {
  const uri = process.env.MONGO_URI
    ? process.env.MONGO_URI.replace(/\/[^/]+(\?|$)/, "/finance_test$1")
    : "mongodb://localhost:27017/finance_test";

  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};