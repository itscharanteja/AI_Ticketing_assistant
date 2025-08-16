const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const ticketRoutes = require("./routes/tickets");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/tickets", ticketRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
const start = async () => {
  try {
    console.log("Attempting to connect to database...");
    console.log(
      `Database config: ${process.env.DB_HOST}:${process.env.DB_NAME}`
    );

    await sequelize.authenticate();
    console.log("Database connected successfully");

    await sequelize.sync();
    console.log("Database tables synchronized");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    console.error("Error details:", error.message);
    // Wait for 5 seconds and try again
    setTimeout(start, 5000);
  }
};

start();
