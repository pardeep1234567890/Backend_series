import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import mongoose, { Aggregate, Mongoose } from "mongoose";

const registerUser = asyncHandler(async (req, res) => {    //It takes a function as input (requestHandler) // That input is your actual async route handler
    // get user details from frontend 
    // validation = it it is empty 
    // check if user already exist = username ,email 
    // check for images and avatar 
    // upload them to cloudinary  
    // create user object :- create entry in DB 
    // remove password and refresh token from response 
    // check for user creation
    // return response 

    const { username, email, fullname, password } = req.body
    // console.log("email",email);
    if (fullname === "") {
        throw new apiError(400, "fullname is required")
    }
    if (password === "") {
        throw new apiError(400, "password is required")
    }
    if (username === "") {
        throw new apiError(400, "username is required")
    }
    if (email === "") {
        throw new apiError(400, "email is required")
    }

    const existedUser = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )
    if (existedUser) {
        throw new apiError(409, "username or email already exists")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverimageLocalPath = req.files?.coverimage[0]?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log("Uploaded Avatar from Cloudinary:", avatar);

    const coverimage = await uploadOnCloudinary(coverimageLocalPath)

    if (!avatar) {
        throw new apiError(400, "avatar file is required....")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverimage: coverimage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new apiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new apiResponse(200, createdUser, "User Registered Succcessfully")
    )
})
const loginUser = asyncHandler(async (req, res) => {
    // req body-> data
    // username or email
    // find the user
    // password check
    // generate access and refresh token
    // send cookie to give tokens

    // generate access and refresh token(created a function to generate Tokens)
    const generateAccessTokenAndRefreshTokens = async (userId) => {
        try {
            const user = await User.findById(userId)
            const accessToken = await user.generateAccessToken()
            const refreshToken = await user.generateRefreshToken()
            user.refreshToken = refreshToken
            await user.save({ validateBeforeSave: false })
            return { accessToken, refreshToken }

        } catch (error) {
            throw new apiError(500, "Something went wrong whilee generating the Tokens")
        }
    }
    // req body-> data(we take the data from request body)
    const { password, email, username } = req.body

    //check username or email
    if (!(username || email)) {
        throw new apiError(400, "username or email is required")
    }
    // verify using username or email
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    // find the user
    if (!user) {
        throw new apiError(404, "User does not exist")
    }
    // password check
    const ispasswordValid = await user.isPasswordCorrect(password)

    if (!ispasswordValid) {
        throw new apiError(401, "Invalid Password")
    }
    // generate access and refresh token
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id)

    // for security we have , there can not anyone modify cookie from frontend , only server can change it 
    const options = {
        httpOnly: true,
        secure: true
    }

    // send cookie to give tokens
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                {
                    user: accessToken, refreshToken
                },
                "user logged In successfully"
            )
        )


})

// Here we Logout the User 
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, {}, "User logged out"))

})

// Here we refresh the token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new apiError(401, "Unauthorized Request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = User.findById(decodedToken?._id)                 //? = Safely access properties that might not exist       
        if (!user) {
            throw new apiError(401, "Invailid Refresh Token")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, "Refresh Token is Expired or used ")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newrefreshToken } = await generateAccessTokenAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refeshToken", newrefreshToken, options)
            .json(new apiResponse(
                200,
                {
                    accessToken, refreshToken: newrefreshToken
                },
                "Access Token Refreshed"
            ))
    } catch (error) {
        throw new apiError(401, "Invalid Refresh Token")
    }
})

// Here we change the Password
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new apiError(400, "Invalid Old Password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(new apiResponse(200, {}, "Password changed successfully"))
})

// Here we Access the CurrentUser (may be it means the Fronted user Accessing the current User)
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new apiResponse(200, req.user, "current user fetched successfully"))
})

// Here we give Access to Update the User Details (If we want update the Files so make different Controllers for it)
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullname,
            email: email
        }
    }, { new: true }).select("-password")
    return res
        .status(200)
        .json(new apiResponse(200, user, "Account details updated successfully"))

})

// Here we update the User Avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "avatar is not uploaded")
    }
    await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true }).select("-password")

    return res
        .status(200)
        .json(new apiResponse(200, user, "avatar updated successfully"))
})
// Here we Update the CoverImage 
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage file is missing")
    }
    const coverimage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverimage.url) {
        throw new ApiError(400, "coverimage is not uploaded")
    }
    await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverimage: coverimage.url
        }
    }, { new: true }).select("-password")

    return res
        .status(200)
        .json(new apiResponse(200, user, "coverimage updated successfully"))
})

// Here we find the Channel details and send to the users (like how much subscribers )
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username) {
        throw new apiError(400, "username is missing")
    }
    const channel = await User.aggregate([
        {
            $match: {                                   //$match : it is used for filtering
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {                              //$lookup: it is used for, Joins with another collection
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
            //now to add these to fields in One documents 
            $addFields: {                                 //create new fields 
                subscribersCount: {
                    $size: "$subscribers"    //size is used to count the subscriber here 
                },
                channelsSubscribedToCounts: {
                    $size: "subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {                     //$Project: Reshapes documents by including/excluding or computing fields
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCounts: 1,
                isSubscribed: 1,
                email: 1,
                coverimage: 1,
                avatar: 1
            }
        }
    ])
    if (!channel?.length) {
        throw new apiError(404, "Channel doesn't Exist")
    }
    return res
        .status(200)
        .json(new apiResponse(200, channel[0], "user channel fetched successfully"))
})
// Here we find the userWatchHistory 
const getWatchHistory = asyncHandler(async (req, res) => {
    // req.user?._id :- ("req.user?._id" by this we find the string not the mongodb objectid mongoose change this )mongoose change this ID(which comes from user) to the MongoDB object ID behind the scene
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)   //( There mongoose doesn't work b/z all the aggrigation pipeline code goes directly )
            }
        },
        {
            $lookup: {                          //$lookup : It is used to Joins with another collections
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
                                    $project: {              //$project : reshapes every documents that flows through your aggregation pipeline
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {        //$addFields:it adds one or more new fields to every document that reaches this stage of the aggregation pipeline.
                            owner: {
                                $first: "$owner"
                            }

                        }
                    }
                ]

            }
        }
    ])
    return res
    .status(200)
    .json(
        new apiResponse(200,user[0].watchHistory,"watch history fetched successfully")
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} 