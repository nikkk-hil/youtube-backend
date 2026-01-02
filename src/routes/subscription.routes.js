import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { getChannelSubscribers, getSubscribedChannels, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/toggle-subscription/:channelId").post(toggleSubscription)
router.route("/get-subscribed-channels/:subscriberId").get(getSubscribedChannels)
router.route("/get-channel-subscribers/:channelId").get(getChannelSubscribers)

export { router }