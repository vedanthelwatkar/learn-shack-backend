import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import otpRoutes from "./routes/otpRoutes.js";
import getS3 from "./routes/getS3.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://learnshackedu.com",
      "https://learnshackedu.com",
      "http://www.learnshackedu.com",
      "https://www.learnshackedu.com",
      "https://learn-shack.vercel.app",
      "http://192.168.0.103:5173/",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
