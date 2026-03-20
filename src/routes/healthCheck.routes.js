import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { healthCheck } from "../controllers/healthcheck.controller.js";

const router = Router()

router.route("/get").get(healthCheck)

export {router}