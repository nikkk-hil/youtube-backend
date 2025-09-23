import { Router } from "express";
import { userRegistration } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/registration").post(
    // middleware will look for form fields with the names avatar and coverImage.
    upload.fields([
        {
            name: "avatar",
            maxCount: 1 
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    userRegistration
);

export { router }