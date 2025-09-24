import { Router } from "express";
import { refreshAccessToken, userLogin, userLogout, userRegistration } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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

router.route("/login").post(userLogin);

//secured routes
router.route("/logout").post(verifyJWT ,userLogout);
router.route("/refresh-access-token").post(refreshAccessToken);

export { router }