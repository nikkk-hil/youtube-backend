import mongoose from "mongoose";
import { db_name } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`);
        console.log(`\n MongoDB Connected! DB HOST: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.error('MONGODB CONNECTION FAILED', error);
        process.exit(1);  //build in method in node.js immediately ends the process of node js if code is 1 i.e. exit with failure if code = 0 exit with success
    }
}

export default connectDB;