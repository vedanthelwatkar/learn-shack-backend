import express from "express";
import { getUsers, postContactInfo } from "../controllers/contactController.js";

const router = express.Router();

router.post("/", postContactInfo);

router.get("/", getUsers);

export default router;
