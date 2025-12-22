import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const getVideoComments = asyncHandler( async(req, res) => {

    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!videoId)
        throw new ApiError(400, "Video id is required!")

    if (!mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Video id is invalid")

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum-1)*limitNum

    // const sortOptions = { [sortBy]: sortType === "asc" ? 1 : -1 }

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $sort: {
                likesCount: -1,
                createdAt: -1
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limitNum
        },
        {
            $project: {
                content: 1,
                video: 1,
                owner: 1,
                likesCount: 1,
            }
        }
    ])

    // const comments = await Comment.find({video: videoId})
    //                  .sort(sortOptions)
    //                  .skip(skip)
    //                  .limit(limitNum)
    //                  .populate("owner", "username avatar")
    //                  .lean()
    
    if (!comments)
        throw new ApiError(500, "Something went wrong while extracting comments.")

    return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully!"))
})

const addComment = asyncHandler( async(req, res) => {

    const {videoId} = req.params
    const {content} = req.body

    if (!content || !content.trim() === "")
        throw new ApiError(400, "Content is required!")
    if (!videoId)
        throw new ApiError(400, "Video Id is required!")
    if (!mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Invalid Video Id!")

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    if (!comment)
        throw new ApiError(500, "Something went wrong, while adding a comment.")


    return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully!"))

})

const updateComment = asyncHandler( async(req, res) => {
    const {commentId} = req.params
    const {content} = req.body
    const userId = req.user?._id

    if (!content || !content.trim() === "")
        throw new ApiError(400, "Content is required!")
    if (!commentId)
        throw new ApiError(400, "Comment id is required!")
    if (!content)
        throw new ApiError(400, "content id required!")
    if (!mongoose.isValidObjectId(commentId))
        throw new ApiError(400, "Invalid comment id!")

    const comment = await Comment.findById(commentId)

    if (userId.toString() !== comment.owner.toString())
        throw new ApiError(401, "Not authorized to update comment!")

    comment.content = content
    await comment.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully!"))
})

const deleteComment = asyncHandler( async(req, res) => {
    const {commentId} = req.params

    if (!commentId)
        throw new ApiError(400, "Comment id is required!")
    if (!mongoose.isValidObjectId(commentId))
        throw new ApiError(400, "Invalid comment id!")    

    const comment = await Comment.findById(commentId)

    if (req.user?._id.toString() !== comment.owner.toString())
        throw new ApiError(401, "Not authorized to delete comment!")

    await Comment.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully!"))

})

export{
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}