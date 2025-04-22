import { db } from "../db.js";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import dotenv from "dotenv";
dotenv.config();

const sns = new SNSClient({ region: process.env.AWS_REGION });

export const sendOtp = async (req, res) => {
  const { phoneNumber, resend } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required",
    });
  }

  try {
    // ======= Rate Limiting Block (skip if it's a resend request) =======
    if (!resend) {
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
        return res.status(429).json({
          success: false,
          message: `Too many OTP requests. Try again later.`,
        });
      }
    }

    // ======= Generate OTP =======
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Save to DB
    await db.execute("INSERT INTO otps (phone_number, otp) VALUES (?, ?)", [
      phoneNumber,
      otp,
    ]);

    // Return directly in development
    if (process.env.NODE_ENV !== "production") {
      return res.json({
        success: true,
        message: "OTP generated (dev mode)",
        otp,
      });
    }

    // Send SMS via AWS SNS in production
    const message = `[LearnshackEdu] Your authentication code is: ${otp}`;
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

    res.json({ success: true, message: resend ? "OTP resent" : "OTP sent" });
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
         AND created_at >= NOW() - INTERVAL 5 MINUTE
       ORDER BY created_at DESC
       LIMIT 1`,
      [phoneNumber]
    );

    if (rows.length > 0 && rows[0].otp === otp) {
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
