import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//completed
const createTweet = asyncHandler( async (req, res) => {
 
    const { content } = req.body
    const userId = req.user?._id

    if (!content)
        throw new ApiError(400, "Content is Required!!")

    if (!userId)
        throw new ApiError(401, "You are not authenticate to tweet")

    const tweet = await Tweet.create({
        owner: userId,
        content
    })

    const createdTweet = await Tweet.findById(tweet._id)
                               .populate("owner", "avatar username")
                               .lean()

    return res
    .status(201)
    .json( new ApiResponse( 201, createdTweet, "Tweet created successfully!!"))
})


const getTweet = asyncHandler( async (req, res) => {

    const userId = req.user?._id
    if (!userId)
        throw new ApiError(401, "You are not authenticate to tweet")

    const userTweets = await Tweet.find({ owner: userId })
                   .populate("owner", "avatar username")
                   .sort({createdAt: -1})
                   .lean()

    if (!userTweets)
        throw new ApiError(500, "User Tweets not found!!")

    return res
    .status(200)
    .json( new ApiResponse( 200, userTweets, "User Tweet Fetched Successfully!!" ))

})


const updateTweet = asyncHandler ( async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body

    if (!tweetId)
        throw new ApiError(400, "Tweet Id is required!!")

    if (!mongoose.isValidObjectId(tweetId))
        throw new ApiError(400, "Tweet Id is invalid")

    if (!content?.trim())
        throw new ApiError(400, "Content is required!!")

    const userId = req.user?._id
    if (!userId)
        throw new ApiError(401, "User is not authorized!!")

    const tweet = await Tweet.findById(tweetId)
                             .populate("owner", "username avatar")

    if (tweet.owner._id.toString() !== userId.toString())
        throw new ApiError(401, "User is not authenticate to update tweet")

    tweet.content = content
    await tweet.save({validateBeforeSave: false});

    return res
    .status(200)
    .json( new ApiResponse(200, tweet, "Tweet Updated Successfully") )


})

const deleteTweet = asyncHandler( async (req, res) => {
    const { tweetId } =  req.params

    if (!tweetId)
        throw new ApiError(400, "Tweet Id is not found")

    if (!mongoose.isValidObjectId(tweetId))
        throw new ApiError(400, "Tweet Id is invalid!!")

    const userId = req.user?._id
    if (!userId)
        throw new ApiError(400, "User Id not found!!")

    const tweet = await Tweet.findById(tweetId)

    if (!tweet)
        throw new ApiError(404, "Tweet not found!!")

    if (tweet.owner.toString() !== userId.toString())
        throw new ApiError(401, "User is not authicated to delete Tweet")

    await Tweet.findByIdAndDelete(tweetId);

    return res
    .status(200)
    .json( new ApiResponse( 200, {}, "Tweet deleted successfully!!"))

})

export{
    createTweet,
    getTweet,
    updateTweet,
    deleteTweet,
}