require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    const baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://finance-dashboard-api-vyn1.onrender.com"
        : `http://localhost:${PORT}`;

    console.log(`Swagger docs at ${baseUrl}/docs`);
  });
});