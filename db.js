import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const db = mysql.createPool({
  host: process.env.DB_HOST?.trim(),
  user: process.env.DB_USER?.trim(),
  password: process.env.DB_PASSWORD?.trim(),
  database: process.env.DB_NAME?.trim(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
