import { db } from "./db.js";

try {
  const [result] = await db.execute("SELECT 1");
  console.log("✅ DB Connected");
} catch (err) {
  console.error("❌ DB Connection failed:", err.message);
}
