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
 
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});
 
module.exports = app;