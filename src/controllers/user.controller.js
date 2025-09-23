import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";

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


export { 
    userRegistration,

};