import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { toggleSubscription } from "../controllers/subscription.controller";

const router = Router()

router.use(verifyJWT)

router.route("/toggle-subscription/:channelId").post(toggleSubscription)