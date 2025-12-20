import mongoose from "mongoose"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiErrors.js"
import { Like } from "../models/like.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Video} from "../models/video.model.js"


const toggleVideoLike = asyncHandler( async(req, res) => {
    const {videoId} = req.params

    if (!videoId)
        throw new ApiError(400, "Video Id is required!")
    if (!mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Invalid video id.")

    const like = await Like.findOne({likedBy: req.user?._id, video: videoId})
                           .lean()
    let message = ""

    if (like){
        await Like.findByIdAndDelete(like._id)
        message = "Unliked"
    }
    else {
        await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })
        message = "Liked"
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, {}, message))

})

const toggleCommentLike = asyncHandler( async(req, res) => {

    const {commentId} = req.params

    if (!commentId)
        throw new ApiError(400, "Comment Id is required!")
    if (!mongoose.isValidObjectId(commentId))
        throw new ApiError(400, "Invalid comment id.")

    const like = await Like.findOne({likedBy: req.user?._id,
                                    comment: commentId})
                           .lean()
    let message = ""

    if (like){
        await Like.findByIdAndDelete(like._id)
        message = "Unliked"
    }
    else {
        await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })
        message = "Liked"
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, {}, message))

})

const toggleTweetLike = asyncHandler( async(req, res) => {

    const {tweetId} = req.params

    if (!tweetId)
        throw new ApiError(400, "tweet Id is required!")
    if (!mongoose.isValidObjectId(tweetId))
        throw new ApiError(400, "Invalid tweet id.")

    const like = await Like.findOne({likedBy: req.user?._id,
                                    tweet: tweetId})
                           .lean()
    let message = ""

    if (like){
        await Like.findByIdAndDelete(like._id)
        message = "Unliked"
    }
    else {
        await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })
        message = "Liked"
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, {}, message))

})

const getAllLikedVideos = asyncHandler( async(req, res) => {
    // const videos = await Video.find({ 
    //                         likedBy: req.user?._id,
    //                         video: { $ne: null, $exists: true}
    //                     })

    const videos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline:[
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
        },
        {
            $addFields: {
                likedVideoCount: {
                    $size: "$likedVideos"
                }
            }
        },
        {
            $project: {
                likedVideos: 1,
                likedVideoCount: 1
            }
        }
    ])

    if (!videos)
        throw new ApiError(500, "Something went wrong, while extracting all liked videos.")

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "All liked video fetched."))
})

export{
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getAllLikedVideos
}