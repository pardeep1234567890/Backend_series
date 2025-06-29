import mongoose from "mongoose"
import { DB_NAME } from "../constants.js";

const DBCONNECT = async ()=>{
    try{
   const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
   console.log(`/n MONGODB connected !! DB Host : ${connectionInstance.connection.host} `);
    }catch(error){
        console.log("Mongodb connection failed ",error);
        process.exit(1)
    }
}
export default DBCONNECT