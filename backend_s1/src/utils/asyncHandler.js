// Here we make a wrapper function to handle the error of Async function
const asyncHandler = (requestHandler)=>{             //It takes a function as input (requestHandler) // That input is your actual async route handler
    return (req,res,next)=>{                        //Now, asyncHandler returns a new function.//That new function looks like a normal Express middleware: it takes req, res, and next.//So when Express runs a route, this returned function will run.
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }                                                              
}

export {asyncHandler}

// const asynchandler = (fn) => async(req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         console.log(error)
//     }
// }