import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import otpRoutes from "./routes/otpRoutes.js";
import getS3 from "./routes/getS3.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

//cors
app.use(cors());

// Middleware
app.use(express.json());
app.use("/otp", otpRoutes);
app.use("/get-s3", getS3);

// Routes
app.get("/", (req, res) => {
  res.send("Hello from Express, you're good to go!");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
