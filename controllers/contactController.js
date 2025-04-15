import { db } from "../db.js";

export const postContactInfo = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      countryCode,
      selectedDestinations,
      intake,
      examType,
    } = req.body;

    if (!fullName || !email || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const destinations = Array.isArray(selectedDestinations)
      ? selectedDestinations.join(",")
      : selectedDestinations;

    const [result] = await db.execute(
      `INSERT INTO contact 
        (full_name, email, phone_number, country_code, destinations, intake, exam_type, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        fullName,
        email,
        phoneNumber,
        countryCode,
        destinations,
        intake,
        examType,
      ]
    );

    const insertId = result.insertId;

    return res.status(200).json({
      success: true,
      message: "Contact information saved successfully",
      data: { id: insertId },
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
