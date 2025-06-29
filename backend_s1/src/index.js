// require("dotenv").config({path:"./env"})
import dotenv from "dotenv"
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
import DBCONNECT from "./db/index.js";
import {app} from "./app.js"

dotenv.config({
    path:'./.env'
})

DBCONNECT()

.then(()=>{
        app.listen(process.env.PORT||8000,()=>
        {console.log(`server is running at port : ${process.env.PORT}`)})
    })
.catch((err)=>{
    console.log("mongodb connection failed !!! ",err);
})
