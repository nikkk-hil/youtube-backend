import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";

const router = Router()

router.use(verifyJWT)
router.route("/get-channel-stats").get(getChannelStats)
router.route("get-channel-videos").get(getChannelVideos)

export { router }