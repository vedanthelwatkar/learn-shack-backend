import { db } from "../db.js";
import twilio from "twilio";

import dotenv from "dotenv";
dotenv.config();

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendOtp = async (req, res) => {
  const { phoneNumber } = req.body;

  // ======= Rate Limiting Block =======
  const [countResult] = await db.execute(
    `SELECT COUNT(*) as count FROM otps 
     WHERE phone_number = ? AND created_at >= NOW() - INTERVAL 1 HOUR`,
    [phoneNumber]
  );

  if (countResult[0].count >= 5) {
    const [earliest] = await db.execute(
      `SELECT MIN(created_at) as earliest FROM otps 
       WHERE phone_number = ? AND created_at >= NOW() - INTERVAL 1 HOUR`,
      [phoneNumber]
    );

    const earliestTime = new Date(earliest[0].earliest);
    const retryAfter = new Date(earliestTime.getTime() + 60 * 60 * 1000);
    const now = new Date();
    const waitMinutes = Math.ceil((retryAfter - now) / 60000);

    return res.status(429).json({
      success: false,
      message: `Too many OTP requests. Try again in ${waitMinutes} minute(s).`,
    });
  }

  // ======= Generate OTP =======
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  try {
    // Save OTP to DB
    await db.execute("INSERT INTO otps (phone_number, otp) VALUES (?, ?)", [
      phoneNumber,
      otp,
    ]);

    // In development or staging, return OTP directly (for testing)
    if (process.env.NODE_ENV !== "production") {
      return res.json({
        success: true,
        message: "OTP generated (dev mode)",
        otp,
      });
    }

    // Send OTP via Twilio in production
    const message = `Learn Shack OTP: ${otp}`;

    // Production configuration (Twilio auto-selects a random number)
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // Optional, Twilio can randomize if this is omitted
      to: phoneNumber,
    });

    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const verifyOtp = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM otps 
       WHERE phone_number = ? 
         AND otp = ? 
         AND created_at >= NOW() - INTERVAL 5 MINUTE`,
      [phoneNumber, otp]
    );

    if (rows.length > 0) {
      await db.execute("DELETE FROM otps WHERE phone_number = ?", [
        phoneNumber,
      ]);

      res.json({ success: true, message: "OTP verified" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};
