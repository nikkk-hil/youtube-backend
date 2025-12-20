import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPlaylist,
        getUserPlaylists,
        getPlaylistById,
        addVideoToPlaylist,
        removeVideoFromPlaylist,
        deletePlaylist,
        updatePlaylist
 } from "../controllers/playlist.controller.js";

 const router = Router()

 router.use(verifyJWT)
 router.route("/create").post(createPlaylist)
 router.route("/get-user-playlists/:userId").get(getUserPlaylists)
 router.route("/get-playlist/:playlistId").get(getPlaylistById)
 router.route("/add-video/:playlistId/:videoId").patch(addVideoToPlaylist)
 router.route("/remove-video/:playlistId/:videoId").patch(removeVideoFromPlaylist)
 router.route("/delete/:playlistId").get(deletePlaylist)
 router.route("/update/:playlistId").patch(updatePlaylist)

 export {router}