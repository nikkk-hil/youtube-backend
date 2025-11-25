import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const getChannelStats = asyncHandler( async(req, res) => {
    /* total views, likes, subscriber, videos, duration */

    const channelStats = await User.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "channelVideos",
                pipeline:[
                    {
                        from: "likes",
                        localField: "_id",
                        foreignField: "video",
                        as: "likes"
                    },
                    {
                        $addFields: {
                            likeCount: {
                                $size: "$likes"
                            },
                            viewCount: {
                                $sum: "$views"
                            },
                            totalDuration: {
                                $sum: "$duration"
                            }
                        }
                    },
                    {
                        $project: {
                            likeCount: 1,
                            viewCount: 1,
                            totalDuration: 1
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
                as: "subcribers",
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "subscribers"
                },
                totalVideo: {
                    $size: "channelVideos"
                }
            }
        },
        {
            $project: {
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