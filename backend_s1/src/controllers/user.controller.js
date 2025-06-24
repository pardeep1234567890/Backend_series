import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {apiResponse} from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req,res)=>{    //It takes a function as input (requestHandler) // That input is your actual async route handler
            // get user details from frontend 
            // validation = it it is empty 
            // check if user already exist = username ,email 
            // check for images and avatar 
            // upload them to cloudinary  
            // create user object :- create entry in DB 
            // remove password and refresh token from response 
            // check for user creation
            // return response 

            const {username,email,fullname ,password} = req.body
            console.log("email",email);
            if(fullname === ""){
                throw new apiError(400,"fullname is required")
            }
            if(password === ""){
                throw new apiError(400,"password is required")
            }
            if(username === ""){
                throw new apiError(400,"username is required")
            }
            if(email === ""){
                throw new apiError(400, "email is required")
            }

            const existedUser = User.findOne(
                {
                    $or:[{username},{email}]
                }
            )
            if(existedUser){
                throw new apiError(409,"username or email already exists")
            }
           const avatarLocalPath =  req.files?.avatar[0]?.path;
           const coverimageLocalPath =  req.files?.coverimage[0]?.path;

           if(!avatarLocalPath){
            throw apiError(400,"avatar file is required")
           }
           const avatar = await uploadOnCloudinary(avatarLocalPath)
           const coverimage = await uploadOnCloudinary(coverimageLocalPath)

           if(!avatar){
            throw apiError(400,"avatar file is required")
           }

            const User = await User.create({
            fullname,
            avatar:avatar.url, 
            coverimage:coverimage?.url || "",
            email,
            password,
            username:username.toLowerCase()
           })

           const createdUser = await User.findById(User._id).select(
            "-password -refreshToken"
           )
           if(!createdUser){
            throw new apiError(500,"Something went wrong while registering the user")
           }
           return res.status(201).json(
            new apiResponse(200,createdUser,"User Registered Succcessfully")
           )
}) 
export {registerUser} 