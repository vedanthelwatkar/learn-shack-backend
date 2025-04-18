import express from "express";
import {
  getContactInfo,
  postContactInfo,
} from "../controllers/contactController.js";

const router = express.Router();

router.post("/", postContactInfo);

router.get("/users", getContactInfo);

export default router;
