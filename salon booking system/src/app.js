import express from "express";

import cors from "cors";
import cookieParser from "cookie-parser";

// import mongoose from "mongoose";
// import { ApiError } from "../../chai-backend-main/src/utils/ApiError.js";
// import { ApiResponse } from "../../chai-backend-main/src/utils/ApiResponse.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// importing all the routes

import { userRouter } from "./routes/user.routes.js";
import { saloonRouter } from "./routes/saloon.routes.js";
import { testRouter } from "./routes/test.routes.js";

// routes declaration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/saloon", saloonRouter);
app.use("/api/v1", testRouter);

export default app;
