import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";
import jwt from "jsonwebtoken";

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

export { 
    userRegistration,
    userLogin,
    userLogout,
    refreshAccessToken
};