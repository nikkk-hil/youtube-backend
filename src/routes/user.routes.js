import { Router } from "express";
import { changeAvatar, changeCoverImage, changePassword, editUserDetails, getUser, getUserChannelProfile, getWatchHistory, refreshAccessToken, userLogin, userLogout, userRegistration } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import multer from "multer";

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
router.route("/change-password").post(verifyJWT, changePassword)
router.route("/edit-user-details").patch(verifyJWT, editUserDetails)
router.route("/get-user").get(verifyJWT, getUser)

router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), changeAvatar)
router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), changeCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/get-watchHistory").get(verifyJWT, getWatchHistory)

export { router }