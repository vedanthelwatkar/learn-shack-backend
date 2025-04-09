import { db } from "../db.js";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import dotenv from "dotenv";
dotenv.config();

const sns = new SNSClient({ region: process.env.AWS_REGION });

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
    // Save to DB
    await db.execute("INSERT INTO otps (phone_number, otp) VALUES (?, ?)", [
      phoneNumber,
      otp,
    ]);

    // 🔁 Return directly in development
    if (process.env.NODE_ENV !== "production") {
      return res.json({
        success: true,
        message: "OTP generated (dev mode)",
        otp,
      });
    }

    // Send SMS via AWS SNS in production
    const message = `Learn Shack OTP: ${otp}`;
    const params = {
      Message: message,
      PhoneNumber: phoneNumber,
      MessageAttributes: {
        "AWS.SNS.SMS.SenderID": {
          DataType: "String",
          StringValue: "LearnShack",
        },
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional",
        },
      },
    };

    await sns.send(new PublishCommand(params));

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
