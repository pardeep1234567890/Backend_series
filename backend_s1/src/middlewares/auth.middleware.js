//it veify only that user exist or not(It verifies the JWT token sent by the user, checks if the token is valid)

import jwt from "jsonwebtoken";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
    
        if(!token){
            throw new apiError(401,"Unauthorized request ")
        }
        const decodeToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodeToken?._id).select("-password -refreshToken") //?: Safely access properties that might not exist
        if(!user){
            throw new apiError(401,"Invalid access Token ")
        }
        req.user = user //Attach User to Request Object
        next()
    } catch (error) {
        throw new apiError(401,"Invalid access Token ")
    }
})