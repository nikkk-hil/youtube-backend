import { Router } from "express";
import { userRegistration } from "../controllers/user.controller.js";

const router = Router();

router.route("/registration").post(userRegistration);

export { router }