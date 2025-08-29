import dotenv from 'dotenv';
import connectDB from './db/connection.js';
import express from 'express';
// import mongoose from 'mongoose';
// import {db_name} from './constants.js'

const app = express();

dotenv.config({ path: './.env' });

connectDB()
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running at port: ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MongoDB Connection Failed !!", err);
        
    })

//IFI FUNCTION
/*
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`)
        app.on('ERROR !', (error) => {
            console.log("ERRR :", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR", error);
        throw error;
    }
} )()
*/