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

export const getContactInfo = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || "";

  try {
    let query = `SELECT * FROM contact`;
    let countQuery = `SELECT COUNT(*) as total FROM contact`;
    let whereClause = "";

    if (search) {
      whereClause = ` WHERE full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?`;
    }

    const finalQuery = `${query}${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const [data] = await db.execute(finalQuery, [
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    ]);

    const finalCountQuery = `${countQuery}${whereClause}`;
    const [countResult] = await db.execute(finalCountQuery, [
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    ]);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: "Contact information fetched successfully",
      data: {
        contacts: data,
        pagination: {
          total,
          page,
          totalPages,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
