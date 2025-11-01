import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndReference = async (userId) => {

    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
          
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token.");
    }
}

const userRegistration = asyncHandler( async (req, res) => {
    /*
        Getting Details of user from frontend
        validate the details - not empty
        check if user already exists (like unique username, email)
        check for images (compulsory check for avatar) and upload it to cloudinary
        create user object - create entry in db
        remove password and refreshtoken from response
        check for user creation
        return response
    */

        const {fullName, email, username, password} = req.body   // data coming from form or json can be extracted from here
        // console.log("email: ", email);
        // console.log("password: ", password);
        // console.log(req);

        if ([fullName, email, username, password].some(  // true → if any element passes the test & false → if none pass.
            (field) => field?.trim() === ""
        )){
            throw new ApiError(400, "All Fields are required.");
        }

         const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

        console.log(req.files);
        

        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        const coverImgLocalPath = req.files?.coverImage?.[0]?.path;

        console.log(avatarLocalPath);

        if (!avatarLocalPath)
            throw new ApiError(400, "Avatar file is required");

        

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImgLocalPath);

        console.log(avatar);

        if (!avatar)
            throw new ApiError(400, "Avatar file is required.....");

        const user = await User.create({
            fullName,
            username: username.toLowerCase(),
            email,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || ""
        });

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if (!createdUser)
            throw new ApiError(500, "Something went wrong while registering the user ")

        return res.status(201).json(
            new ApiResponse(200, createdUser, "User Registered Successfully")
        )
})

const userLogin = asyncHandler( async (req, res) => {
/*
    username or email dono se login dena hai
    take username or email and password from user
    check they should not empty
    search that username or email in the db
    compare password
    refresh and access token generate and give through secure cookies
    login
*/

    const {username, email, password} = req.body;

    console.log(email)

    if (!username && !email)
        throw new ApiError(401, "Email or Username is required.");

    if (!password)
        throw new ApiError(401, "Password is required.");

    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })

    if (!existedUser)
        throw new ApiError(409, "Username or Email doesn't exist.")

    const isCorrect = await existedUser.isPasswordCorrect(password);

    console.log("isCorrect: ", isCorrect);
    

    if (!isCorrect)
        throw new ApiError(409, "Password is incorrect!");

    const {accessToken, refreshToken} = await generateAccessAndReference(existedUser._id);
    // console.log("userId: ", existedUser._id);
    

    // console.log("access :", accessToken);
    // console.log("refresh :", refreshToken);
    

    const loggedInUser = await User.findById(existedUser._id).select("-password -refreshToken");

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(201)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken, refreshToken
      },
      "User Logged In Successfully!"
    )
  );

});

const userLogout = asyncHandler ( async (req, res) => {
/*
    delete refreshToken from user db
    delete refresh and access token from cookies
*/
    const user = req.user;
    await User.findByIdAndUpdate(user._id,
        {
            refreshToken: undefined
        },
        {
            new: true // provide updated user where refreshToken will be undefined
        }
    );

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(
        new ApiResponse(201, {}, "User Logged Out Successfully!")
    );


})

const refreshAccessToken = asyncHandler ( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken)
        throw new ApiError(401, "Unauthorized Request!");

    const decodedToken = jwt.verify(incomingRefreshToken,
                                    process.env.REFRESH_TOKEN_SECRET)
    
    const user = await User.findById(decodedToken?._id).select("-password");

    if (!user)
        throw new ApiError(401, "Invalid Refresh Token!");

    if (incomingRefreshToken !== user.refreshToken)
        throw new ApiError(401, "Refresh Token is either expired or used");

    const {refreshToken, accessToken} = await generateAccessAndReference(user._id);

    const option = {
            httpOnly: true,
            secure: true
        }

    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(
            201,
            {
                accessToken,
                refreshToken
            },
            "Access Token Refreshed!"
        )
    )


    
})

const changePassword = asyncHandler ( async (req, res) => {

    const {oldPassword, newPassword, confirmPassword} = req.body
    const user = req.user

    if (!user)
        throw new ApiError(500, "user not found in the req")

    const isCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isCorrect)
        throw new ApiError(401, "Password is incorrect")

    if (newPassword !== confirmPassword)
        throw new ApiError(401, "new and confirm password is not same")

    user.password = newPassword
    user.save({validateBeforeSave: false})

    return res.
    status(200)
    .json(new ApiResponse(201, {}, "Password Changed Successfully!"))
    
})

const editUserDetails = asyncHandler ( async (req, res) => {
    const {fullName, email} = req.body

    if (!fullName && !email)
        throw new ApiError(401, "All details are required")

    const userId = req.user?._id

    if (!userId)
        throw new ApiError(400, "User is not in req!")

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { fullName, email }},
        { new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(201, updatedUser, "Name and Email Updated!"))
})

const changeAvatar = asyncHandler ( async (req,res) => {

    const avatarPath = req.file?.path

    if (!avatarPath)
        throw new ApiError(401, "avatar path not found!!")

    const avatar = await uploadOnCloudinary(avatarPath);

    if (!avatar.url)
        throw new ApiError(400, "Upload on Cloudinary Failed!!");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set : {avatar: avatar.url}},
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse (201, user, "Avatar Updated!!"))


})

const changeCoverImage = asyncHandler ( async (req, res) => {
    const coverImgPath = req.file?.path

    if (!coverImgPath)
        throw new ApiError(401, "Conver image path not found!!")

    const coverImage = await uploadOnCloudinary(coverImgPath);

    if (!coverImage.url)
        throw new ApiError(501, "Upload on Cloudinary Failed!!");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set : {coverImage: coverImage.url}},
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse (201, user, "Cover Image Updated!!"))
})

const getUser = asyncHandler ( async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(201, req.user, "User Fetched Successfully!!"));
})

const getUserChannelProfile = asyncHandler ( async (req, res) => {

    const username = req.params

    if (!username?.trim())
        throw new ApiError(401, "Unauthorized!!")

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()  //filter documents on the basis of username
            }
        },
/*
        {
            $lookup: {
                from: <collection to which you want to perform outer left join>,
                localField: <field to the currect document you want to perform equalization with foreign field>,
                foreignField: <field to the "from" collection document to perform equalization with localField>,
                as: <name of the newly formed field (array of object) in the current collection>
            }
        },
*/
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id /* this is the user visiting a particular channel */, "$subscribers.subscriber" /* this is the channel visitor is visiting */]},
                        /* Here the visitor id is being searched in the channel if it's present -> true else -> false */
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if (!channel?.length)
        throw new ApiError(401, "Channel not found!!")

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User Channel Fetched Successfully!!")
    )

})

const getWatchHistory = asyncHandler ( async (req, res) => {
    const id = req.user?._id // this is string not mongoDb object Id

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id)    
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        {

        }
    ])

    if (!user)
        throw new ApiError(401, "User History not found!!")

    return res
    .status(200)
    .json(new ApiResponse (200, user[0].watchHistory, "Watch History Fetched Successfully!!"))

})

export { 
    userRegistration,
    userLogin,
    userLogout,
    refreshAccessToken,
    changePassword,
    editUserDetails,
    changeAvatar,
    changeCoverImage,
    getUser,
    getUserChannelProfile,
    getWatchHistory
};