import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import otpRoutes from "./routes/otpRoutes.js";
import getS3 from "./routes/getS3.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// CORS middleware - simpler version that allows all origins
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(204).send();
  }

  next();
});

// Middleware
app.use(express.json());
app.use("/otp", otpRoutes);
app.use("/get-s3", getS3);
app.use("/contact", contactRoutes);

// Routes
app.get("/", (req, res) => {
  res.send("Hello from Express, you're good to go!");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
