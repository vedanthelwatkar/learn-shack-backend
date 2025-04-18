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

export const getUsers = async (req, res) => {
  try {
    let {
      page = 1,
      perPage = 10,
      search = "",
      sortField = "created_at",
      sortOrder = "desc",
    } = req.query;

    // Ensure these are numbers
    page = Number.parseInt(page);
    perPage = Number.parseInt(perPage);

    // Calculate offset for pagination
    const offset = (page - 1) * perPage;

    // Build queries based on whether search is provided
    let countQuery, usersQuery, countParams, usersParams;

    if (search && search.trim() !== "") {
      // With search condition
      const searchValue = `%${search}%`;

      countQuery = `
        SELECT COUNT(*) as total FROM contact
        WHERE full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?
      `;
      countParams = [searchValue, searchValue, searchValue];

      // Using direct values for LIMIT and OFFSET
      usersQuery = `
        SELECT * FROM contact
        WHERE full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?
        ORDER BY ${sortField} ${sortOrder.toUpperCase()}
        LIMIT ${perPage} OFFSET ${offset}
      `;
      usersParams = [searchValue, searchValue, searchValue];
    } else {
      // Without search condition
      countQuery = `SELECT COUNT(*) as total FROM contact`;
      countParams = [];

      // Using direct values for LIMIT and OFFSET
      usersQuery = `
        SELECT * FROM contact
        ORDER BY ${sortField} ${sortOrder.toUpperCase()}
        LIMIT ${perPage} OFFSET ${offset}
      `;
      usersParams = [];
    }

    // Execute count query
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Execute users query
    const [users] = await db.execute(usersQuery, usersParams);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: {
        users,
        total,
        page,
        perPage,
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

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(`SELECT * FROM contact WHERE id = ?`, [
      id,
    ]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: { user: result[0] },
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
