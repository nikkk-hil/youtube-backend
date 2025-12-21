import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const getChannelStats = asyncHandler( async(req, res) => {
    /* total views, likes, subscriber, videos, duration */

    const channelStats = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "channelVideos",
                pipeline:[
                    {
                        $lookup:{
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "likes"
                        }
                    },
                    {
                        $addFields: {
                            likeCount: {
                                $size: "$likes"
                            }
                        }
                    },
                    {
                        $project: {
                            owner: 0,
                            createdAt: 0,
                            updatedAt: 0,
                            __v: 0,
                            likes: 0
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                totalVideo: {
                    $size: "$channelVideos"
                },
                viewCount: {
                    $sum: "$channelVideos.views"
                },
                totalDuration: {
                    $sum: "$channelVideos.duration"
                },
                totalLikes: {
                    $sum: "$channelVideos.likeCount"
                }
            }
        },
        {
            $project: {
                subscribers: 0,
                watchHistory: 0,
                password: 0,
                refreshToken: 0
            }
        }
    ])

    if (!channelStats)
        throw new ApiError(500, "Something went wrong, while getting channels stats.")

    return res
    .status(200)
    .json(new ApiResponse(200, channelStats, "Channel stats fetched!!"))
})

const getChannelVideos = asyncHandler( async(req, res) => {
    const channelVideos = await Video.find({ owner: req.user?._id })
                                .lean()

    if (!channelVideos)
        throw new ApiError(500, "Something went wrong, while extracting all channel videos.")

    return res
    .status(200)
    .json(new ApiResponse (200, channelVideos, "All videos fetched!"))
})

export{
    getChannelStats,
    getChannelVideos
}