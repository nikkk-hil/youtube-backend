import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// CONFIGURATION, ALL ARE MIDDLEWARES (.USE)

app.use(cors({
    origin: process.env.CORS_OPTIONS,               // Allow frontend at CORS_OPTIONS
    credentials: true                               // Allow cookies/authorizarion headers (needed to use cookies to maintain sessions)
}))

app.use(express.json());                            // for parsing incoming json request and make data available in req.body
app.use(express.urlencoded({ extended: true }));    // for parsing URL-encoded data (from forms) ====== extended true allows nested objects like {user : {name: "Kylie Jenner"}}
app.use(express.static("public"));                  // serve static files from "public" folder (CSS, JS, images, etc)
app.use(cookieParser());                            // Parse all cookies

export default app;