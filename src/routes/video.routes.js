import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { publishVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.use(verifyJWT)

router.route("/publish-video").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]), publishVideo
)

export { router }

