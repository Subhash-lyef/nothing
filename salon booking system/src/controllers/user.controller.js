//import { uploadOnCloudinary } from "../../../chai-backend-main/src/utils/cloudinary.js";
import { deleteOnCloudnary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/APIError.js";
import { ApiResponse } from "../utils/APIResponse.js";
import { asyncHandler1, asyncHandler2 } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// <----------- GENERATE ACCESS AND REFRESH TOKEN- --------->
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();

        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating referesh and access token",
        );
    }
};

// REGISTERD--------------------------------------

const registerUser = asyncHandler1(async (req, res) => {
    // get user detail from frontend
    // validation of reqired field
    // check user already exist or not with mobile and email
    // if image is in the request body then upload it to the uploadOnCloudinary
    // create user object create entry in the database
    // remove password and refresh token field from the response
    // check for user creation
    // return response

    const { fullName, sex, mobile, email, password, dob, city } = req.body;
    // now cheeking required fileld

    // if (sex != "male" || sex != "female" || sex != "other")
    //     throw new ApiError(
    //         400,
    //         "sex should be male,female, and other nothing else",
    //     );
    // checking wheather user already exitst or not
    const existedUser = await User.findOne({
        $or: [{ mobile }, { email }],
    });

    if (existedUser)
        throw new ApiError(409, " User with mobile and email already exitst");

    // now creating a user into the database

    const user = await User.create({
        fullName,
        sex,
        mobile,
        email,
        password,
        dob,
        city,
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken",
    );

    if (!createdUser)
        throw new ApiError(
            500,
            "Sometthing went wriong while registering the user",
        );

    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "User Registerd Succesfully"));
});

// LOGIN -------------------------------------------------
const loginUser = asyncHandler1(async (req, res) => {
    // Extract the data from req body
    const { mobile, password } = req.body;

    // validating correct data receive
    if (!/^\d{10}$/.test(mobile))
        throw new ApiError(400, "Mobile number should be 10 digigt");
    if (password.length === 0)
        throw new ApiError(400, "password shouldn't empty");

    // check wheather user exist or not

    const user = await User.findOne({ mobile });

    if (!user) throw new ApiError(404, "User does not exist");

    // checking wheatther password is correct or not

    const isPasswordValid = await user.isPasswordValid(password);
    if (!isPasswordValid) throw new ApiError(404, " Incorrect Password");

    // generate refresh and Acess token also save the refresh token in the database
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
        user._id,
    );

    const loggedInUser = await User.findById(user._id).select(" -password ");

    const options = {
        httpOnly: true,
        secure: true,
    };

    // sending response with Access and refresh token
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged In Successfully",
            ),
        );

    // send the user with access token with refresh token
});

// <---------LOGOUT ----------->

const logoutUser = asyncHandler1(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1, // this removes the field from document
            },
        },
        {
            new: true,
        },
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"));
});

// <------------------- UPDATE AVATAR------------------------>

const updateAvatar = asyncHandler1(async (req, res) => {
    const avatarLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is not in  file is missing");
    }

    // delete old image - assignment
    // const oldAvatar = req.user?.avatar || " ";

    const oldAvatar = req.user?.avatar || "";

    //upload new image

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        { new: true },
    ).select("-password");
    if (oldAvatar) {
        console.log(" old pic deleted from the cloudinary");
        await deleteOnCloudnary(oldAvatar);
    }
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

//<-------------------------CHANGE PASSWORD ----------------->

const changePassword = asyncHandler1(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
        throw new ApiError(
            400,
            " oldPassword and  newPassword field are required",
        );
    const user = await User.findById(req.user?._id);

    const isOldPasswardValid = await user.isPasswordValid(oldPassword);

    if (!isOldPasswardValid) throw new ApiError("400", " Invalid Old password");
    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(201, {}, "Password Change Successfully"));
});

export { registerUser, loginUser, logoutUser, updateAvatar, changePassword };
