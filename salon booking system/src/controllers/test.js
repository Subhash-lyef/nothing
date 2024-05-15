import { deleteOnCloudnary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Saloon } from "../models/saloon.model.js";
import { ApiError } from "../utils/APIError.js";
import { ApiResponse } from "../utils/APIResponse.js";
import { asyncHandler1, asyncHandler2 } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import mongoose, { trusted } from "mongoose";
import { registerUser } from "./user.controller.js";

const testing = asyncHandler1(async (req, res) => {
    const data = req.body;

    console.log(data.name[2]);
    return res.status(200).json(new ApiResponse(201, {}, " succesfull"));
});

export default testing;
