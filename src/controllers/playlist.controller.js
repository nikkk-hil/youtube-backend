import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createPlaylist = asyncHandler( async(req, res) => {

    const {title, description} = req.body
    if (!title)
        throw new ApiError(400, "title is required.")
    if (!description)
        throw new ApiError(400, "description is required.")

    const playlist = await Playlist.create({
        name: title,
        description,
        owner: req.user?._id
    })

    if (!playlist)
        throw new ApiError(500, "Something went wrong while creating playlist.")

    return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist Created!!"))

})

const getUserPlaylists = asyncHandler( async(req, res) => {
    const {userId} = req.params

    if (!userId)
        throw new ApiError(400, "user id is required.")
    if (!mongoose.isValidObjectId(userId))
        throw new ApiError(400, "Invalid user id.")

    const userPlaylists = await Playlist.find({owner: userId}).select("-videos")
    if (!userPlaylists || userPlaylists.length === 0)
        throw new ApiError(500, "Something went wrong while finding user playlists.")

    return res
    .status(200)
    .json(new ApiResponse(200, userPlaylists, "User playlists fetched!"))

})

const getPlaylistById = asyncHandler( async(req, res) => {

    const {playlistId} = req.params

    if (!playlistId)
        throw new ApiError(400, "Playlist id is required.")
    if (!mongoose.isValidObjectId(playlistId))
        throw new ApiError(400, "Invalid playlist id")

    const playlist = await Playlist.findById(playlistId).lean();

    if (!playlist)
        throw new ApiError(500, "Something went wrong while finding the playlist.")

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched!!"))

})

const addVideoToPlaylist = asyncHandler( async(req, res) => {
    const {playlistId, videoId} = req.params

    if (!playlistId)
        throw new ApiError(400, "Playlist Id is required.")
    if (!videoId)
        throw new ApiError(400, "Video id is required.")
    if (!mongoose.isValidObjectId(playlistId))
        throw new ApiError(400, "Invalid Playlist Id.")
    if (!mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Invalide Video Id.")

    const playlist = await Playlist.findById(playlistId)

    if (playlist?.owner.toString() !== req.user?._id.toString())
        throw new ApiError(401, "User is not authenticate to add video in the playlist.")

    // playlist.videos.push(videoId) // allows duplicates  
    const isVideoPresent = playlist.videos.some((id) => id.toString() === videoId)

    let message = ""

    if (isVideoPresent)
        message = "Video already present in the playlist."
    else{
        playlist.videos.push( new mongoose.Types.ObjectId(videoId) )
        message = "Video added to the playlist."
    }

    await playlist.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, message))

})

const removeVideoFromPlaylist = asyncHandler( async(req, res) => {
     const {playlistId, videoId} = req.params

    if (!playlistId)
        throw new ApiError(400, "Playlist Id is required.")
    if (!videoId)
        throw new ApiError(400, "Video id is required.")
    if (!mongoose.isValidObjectId(playlistId))
        throw new ApiError(400, "Invalid Playlist Id.")
    if (!mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Invalide Video Id.")

    const playlist = await Playlist.findById(playlistId)
    const oldSize = playlist.videos.length

    if (playlist?.owner.toString() !== req.user?._id.toString())
        throw new ApiError(401, "User is not authenticate to delete video in the playlist.")

    playlist.videos = playlist.videos.filter((id) => id.toString() !== videoId)

    if (oldSize === playlist.videos.length)
        throw new ApiError(400, "Video not found in the playlist.")

    await playlist.save({validateBeforeSave: false})

    return res
    .status(200)
    .json( new ApiResponse(200, playlist, "Video deleted from playlist."))
})

const deletePlaylist = asyncHandler( async(req, res) => {

    const {playlistId} = req.params
    if (!playlistId)
        throw new ApiError(400, "Playlist Id is required.")
    if (!mongoose.isValidObjectId(playlistId))
        throw new ApiError(400, "Invalid Playlist Id.")

    const playlist = await Playlist.findById(playlistId)

    if (playlist.owner.toString() !== req.user?._id?.toString())
        throw new ApiError(401, "User is not authenticate to delete playlist.")

    await Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted."))

})

const updatePlaylist = asyncHandler( async(req, res) => {
    const {playlistId} = req.params
    const {tittle, description} = req.body

    if (!playlistId)
        throw new ApiError(400, "Playlist Id is required.")
    if (!mongoose.isValidObjectId(playlistId))
        throw new ApiError(400, "Invalid Playlist Id.")
    if (!tittle)
        throw new ApiError(400, "tittle is required.")
    if (!description)
        throw new ApiError(400, "description is required.")

    const playlist = await Playlist.findById(playlistId)

    if (playlist.owner.toString() !== req.user?._id?.toString())
        throw new ApiError(401, "User is not authenticate to update playlist.")

    playlist.name = tittle
    playlist.description = description

    await playlist.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist Updated."))

})

export{
    createPlaylist,
    addVideoToPlaylist,
    updatePlaylist,
    deletePlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    getUserPlaylists
}