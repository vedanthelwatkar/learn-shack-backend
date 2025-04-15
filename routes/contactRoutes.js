import express from "express";
import { postContactInfo } from "../controllers/contactController.js";

const router = express.Router();

router.post("/", postContactInfo);

export default router;
