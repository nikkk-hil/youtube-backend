import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideoComments, addComment, updateComment, deleteComment } from "../controllers/comment.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/get/:videoId").get(getVideoComments)
router.route("/add/:videoId").post(addComment)
router.route("/update/:commentId").patch(updateComment)
router.route("/delete/:commentId").get(deleteComment)

export { router }
