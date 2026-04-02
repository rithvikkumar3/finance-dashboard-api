const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../swagger");
 
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const recordRoutes = require("./routes/records");
const dashboardRoutes = require("./routes/dashboard");
 
const app = express();
 
app.use(express.json());
 
// API docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
 
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);
 
// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
 
// Handle invalid MongoDB ObjectId format
app.use((err, req, res, next) => {
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  next(err);
});

// Global error handler  ← this already exists, keep it below
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});
 
module.exports = app;