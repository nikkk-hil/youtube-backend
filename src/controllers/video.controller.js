import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";
import { Video } from "../models/video.model.js" 
import { ApiResponse } from "../utils/ApiResponse.js";


const publishVideo = asyncHandler( async(req, res) => {

    const { title, description } = req.body

    if (!title?.trim())
        throw new ApiError(400, "Title is required!!")
    if (!description?.trim())
        throw new ApiError(400, "Description is required!!")

    const videoFilePath = req.files?.videoFile?.[0]?.path
    const thumbnailPath = req.files?.thumbnail?.[0]?.path

    if(!videoFilePath)
        throw new ApiError(401, "Video File is Required!!")
    if (!thumbnailPath)
        throw new ApiError(401, "Thumbail is required!!")

    const videoFile = await uploadOnCloudinary(videoFilePath)
    const thumbnail = await uploadOnCloudinary(thumbnailPath)
    console.log("Video: ", videoFile);
    console.log("Thumbnail: ", thumbnail);

    if (!videoFile)
        throw new ApiError(402, "Video upload on cloudinary failed!!")
    if (!thumbnail)
        throw new ApiError(402, "Thumbnail upload on cloudinary failed!!")

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user?._id
    })

    if (!video)
        throw new ApiError(501, "Something went wrong while creating video database")

    return res
    .status(200)
    .json( new ApiResponse( 200, video, "Video Uploaded Successfully!!"))

})

export {
    publishVideo
}