import express from "express";
import { getS3 } from "../controllers/getS3.js";

const router = express.Router();

router.post("/", getS3);

export default router;
