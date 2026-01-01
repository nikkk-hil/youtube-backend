import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getVideoById, publishVideo, togglePublishStatus, updateVideo, getAllVideos, incrementView } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.use(verifyJWT)

router.route("/get-all-videos").get(getAllVideos)
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
router.route("/get-video/:videoId").get(getVideoById)

router.route("/update-video/:videoId").patch(
    upload.single("thumbnail"), updateVideo)

router.route("/delete-video/:videoId").get(deleteVideo)
router.route("/toggle-publish-status/:videoId").get(togglePublishStatus)
router.route("/update-views/:videoId").post(incrementView)

export { router }

