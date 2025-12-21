import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { destroyFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.service.js";
import { Video } from "../models/video.model.js" 
import { ApiResponse } from "../utils/ApiResponse.js";

const getAllVideos = asyncHandler ( async(req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    
    if (userId && !mongoose.isValidObjectId(userId))
        throw new ApiError(400, "Invalid User Id!!")

    let filter = {}

    if (query && userId){
        filter = {
          $and: [
                { owner: userId },
                { $or: [
                    { title: { $regex: query, $options: "i" }},
                    { description: { $regex: query, $options: "i" }}
                  ]
                }
          ]
        }
    } else if (query){
        filter = {
            $or: [
                { title: { $regex: query, $options: "i" }},
                { description: { $regex: query, $options: "i" }},
            ]  
        }  
    } else if (userId){
        filter = {owner: userId}
    } else {
        filter = {}  //fetch all if nothing is provided
    }

    const isAllowedSortByFields = [ "createdAt", "views", "duration"]
    if (!isAllowedSortByFields.includes(sortBy))
        throw new ApiError(400, "Invalid sort field!!")

    const sortOptions = { [sortBy]: sortType === "asc" ? 1 : -1}

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum-1)* limitNum;

    const totalVideoCnt = await Video.countDocuments(filter)
    const totalPageCnt = Math.ceil(totalVideoCnt/limitNum) 
    
    const videos = await Video.find(filter)
                        .sort(sortOptions)
                        .skip(skip)
                        .limit(limitNum)
                        .populate("owner", "username avatar")
                        .lean()
    
    return res
    .status(200)
    .json( new ApiResponse (200, 
        { videos, totalPageCnt, totalVideoCnt},
        "All videos fetched successfully!!"   
    ))
    
})

const publishVideo = asyncHandler( async(req, res) => {

    const { title, description } = req.body

    if (!title?.trim())
        throw new ApiError(400, "Title is required!!")
    if (!description?.trim())
        throw new ApiError(400, "Description is required!!")

    const videoFilePath = req.files?.videoFile?.[0]?.path
    const thumbnailPath = req.files?.thumbnail?.[0]?.path

    if(!videoFilePath)
        throw new ApiError(400, "Video File is Required!!")
    if (!thumbnailPath)
        throw new ApiError(400, "Thumbail is required!!")

    const videoFile = await uploadOnCloudinary(videoFilePath)
    if (!videoFile)
        throw new ApiError(500, "Video upload on cloudinary failed!!")

    const thumbnail = await uploadOnCloudinary(thumbnailPath)
    if (!thumbnail){
        await destroyFromCloudinary(videoFile.url)
        throw new ApiError(500, "Thumbnail upload on cloudinary failed!!")
    }

    console.log("Video: ", videoFile);
    console.log("Thumbnail: ", thumbnail);


    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user?._id
    })

    if (!video)
        throw new ApiError(500, "Something went wrong while creating video database")

    return res
    .status(201)
    .json( new ApiResponse( 201, video, "Video Uploaded Successfully!!" ))

})

const getVideoById = asyncHandler( async(req, res) => {
    const { videoId } = req.params

    if (!videoId)
        throw new ApiError(400, "VideoId is mising in the url")

    if (!mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Video Id is invalid!!")

    const video = await Video.findById(videoId)
                  .populate("owner", "username avatar") // add username and avatar to the owner object
                  .lean()  // only fetch neccessary details from db document

    if (!video)
        throw new ApiError(404, "Video not found!!")

    return res
    .status(200)
    .json( new ApiResponse( 200, video, "Video Fetched Successfully!!"))
})

const updateVideo = asyncHandler( async (req, res) => {
    const {videoId} = req.params
    const {title, description} = req.body

    if (!title || !description)
        throw new ApiError(400, "Both the fields are required!!")

    const thumbnailPath = req.file?.path
    if (!thumbnailPath)
        throw new ApiError(400, "Thumbnail File is required!!")

    if (!videoId)
        throw new ApiError(400, "VideoId is mising in the url")

    if (!mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Video Id is invalid!!")

    const video = await Video.findById(videoId)
    if (!video)
        throw new ApiError(404, "Video File is not Found!!")

    if (video.owner.toString() !== req.user._id.toString())
        throw new ApiError(403, "You are not authozied to update video!!")

    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    if (!thumbnail?.url)
        throw new ApiError(500, "Uploading of thumbnail on cloudinary failed!!")


    const oldThumbnail = video.thumbnail

    video.thumbnail = thumbnail.url;
    video.title = title;
    video.description = description;
    await video.save({validateBeforeSave: false})

    const deletionResponse = await destroyFromCloudinary(oldThumbnail)
    console.log("Deletion Response: ", deletionResponse);

    return res
    .status(200)
    .json( new ApiResponse( 200, video, "Video details Updated!!" ))
})

// todo work on it seriously
const deleteVideo = asyncHandler( async (req, res) => {
    const { videoId } = req.params

    if (!videoId)
        throw new ApiError(400, "VideoId is mising in the url.")

    if (!mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Video Id is invalid!!")

    const video = await Video.findById(videoId)

    if (!video)
        throw new ApiError(500, "Something went wrong while extracting video document from database")

    if (video.owner.toString() !== req.user._id.toString())
        throw new ApiError(403, "You are not authozied to delete video!!")
    
    const videoUrl = video.videoFile
    const thumbnailUrl = video.thumbnail
    
    await destroyFromCloudinary(videoUrl)
    await destroyFromCloudinary(thumbnailUrl)
    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json( new ApiResponse (200, {}, "Video Deleted Successfully!!"))
    
})

const togglePublishStatus = asyncHandler( async( req, res ) => {
    const {videoId} = req.params

    if (!videoId)
        throw new ApiError(400, "VideoId is mising in the url")

    if (!mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Video Id is invalid!!")

    const video = await Video.findById(videoId)

    if (!video)
        throw new ApiError(404, "Video Not Found!!")
    
    if (video.owner.toString() !== req.user_id.toString())
        throw new ApiError(403, "You are not authozied to toggle publish status of video!!")

    const publishStatus = video.isPublished
    video.isPublished = !publishStatus

    await video.save({validateBeforeSave: false})

    return res
    .status(200)
    .json( new ApiResponse(200, {isPublished: video.isPublished}, "Publish Status TOggled Successfully!!"))
})

export {
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos
}