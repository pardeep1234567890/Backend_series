import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req,res)=>{    //It takes a function as input (requestHandler)
    res.status(200).json({                              // That input is your actual async route handler
    message : "Pardeep-and-code"
    })
}) 
export {registerUser} 