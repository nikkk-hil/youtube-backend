import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import mongoose from "mongoose"
import { Subscription } from "../models/subscription.model.js"

const toggleSubscription = asyncHandler(async (req,res) => {
    const { channelId } = req.params
    const subscriberId = req.user?._id

    if (!channelId)
        throw new ApiError(400, "Channel Id is required.")
    if (!subscriberId)
        throw new ApiError(400, "Subscriber Id is required.")
    if (!mongoose.isValidObjectId(channelId))
        throw new ApiError(400, "Invalid Channel Id")

    //user can't subscribe to himself
    if (subscriberId.toString() === channelId.toString())
        throw new ApiError(400, "User can't subscribe to himself")

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    })

    let message = ""

    if (existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id)
        message = "Unscribed"
    } else {

        const newSubscription = await Subscription.create({
            subscriber: subscriberId,
            channel: channelId
        })
        message = "subscribed"
    }

    return res
    .status(200)
    .json(new ApiResponse (200, {}, message))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {

    const { subscriberId } = req.params
    if (!subscriberId)
        throw new ApiError(400, "Subscriber Id is required!!")
    if (!mongoose.isValidObjectId(subscriberId))
        throw new ApiError(400, "Subscriber Id is invalid.")

    const userId = req.user?._id
    if (!userId)
        throw new ApiError(400, "User Id is required!!")

    if (userId.toString() !== subscriberId.toString())
        throw new ApiError(401, "User is not authenticate to access channels.")

    const channels = await Subscription.find({subscriber: subscriberId})
                                       .populate("channel", "username avatar")
                                       .lean()
    console.log(channels);

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Channels Fetched Successfully."))
    
})

const getChannelSubscribers = asyncHandler(async (req,res) => {
    const { channelId } = req.params
    if (!channelId)
        throw new ApiError(400, "Channel Id is required")
    if (!mongoose.isValidObjectId(channelId))
        throw new ApiError(400, "Channel Id is Invalid.")

    const userId = req.user?._id
    if (!userId)
        throw new ApiError(400, "UserId is required.")

    const subscribers = await Subscription.find({channel: channelId})
                                          .populate("subscriber", "username avatar")
                                          .lean()

    if (!subscribers)
        throw new ApiError(500, "Subscribers not found!")

    console.log(subscribers);

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Subscribers Fetched Successfully."))
})

export {
    toggleSubscription,
    getSubscribedChannels,
    getChannelSubscribers,
}