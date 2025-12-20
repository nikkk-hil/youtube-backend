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

//routes import
import {router as userRouter} from "./routes/user.routes.js"
import {router as videoRouter} from "./routes/video.routes.js"
import { router as tweetRouter } from "./routes/tweet.routes.js";
import { router as subscriptionRouter } from "./routes/subscription.routes.js";
import { router as commentRouter } from "./routes/comment.routes.js";
import { router as dashboardRouter } from "./routes/dashboard.routes.js";
import { router as healthCheckRouter } from "./routes/healthCheck.routes.js";
import { router as likeRouter } from "./routes/like.routes.js";
import { router as playlistRouter } from "./routes/playlist.routes.js";

// routes declaration
app.use("/api/v1/user", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/healthChack", healthCheckRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/playlist", playlistRouter);


export default app;