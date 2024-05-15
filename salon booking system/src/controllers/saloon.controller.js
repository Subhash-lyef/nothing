import { deleteOnCloudnary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Saloon } from "../models/saloon.model.js";
import { ApiError } from "../utils/APIError.js";
import { ApiResponse } from "../utils/APIResponse.js";
import { asyncHandler1, asyncHandler2 } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import mongoose, { trusted } from "mongoose";
import { registerUser } from "./user.controller.js";

// <--------GENERATE REFRRESH AND ACCESS TOKEN -------------->

const generateAccessAndRefreshTokens = async (saloon_Id) => {
    try {
        console.log(" the receive saloon_id  ", saloon_Id);
        const saloon = await Saloon.findById(saloon_Id);
        if (saloon) console.log(" the saloon is found");
        else console.log(" the sallon is not found");

        const accessToken = saloon.generateAccessToken();

        const refreshToken = saloon.generateRefreshToken();

        saloon.refreshToken = refreshToken;
        await saloon.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            `Something went wrong while generating referesh and access token when saloon is trying to login ,, ERROR :${error} `,
        );
    }
};
// <----------------REGISTER SALOON -------------------------->
const saloonRegister = asyncHandler1(async (req, res) => {
    /*
       step 1 ,   Extract data from the request body,
            2 ,   validated data formate 
            3 , cheek wheather data is already exitst or not ,
            4 , create a new user in database,
            5 , retrun the response,

    */
    //step 1

    const {
        saloonName,
        saloonId,
        contact,
        email,
        GSTNumber,
        city,
        location,
        numberOfSeats,
        saloonFor,
        password,
    } = req.body;
    // step 2 will be perfoem by mongoose
    //step 3
    const alreadyRegisterd = await Saloon.findOne({ GSTNumber });

    if (alreadyRegisterd)
        throw new ApiError(400, "GSTNumber already registerd");

    const registerdwithemailcontact = await Saloon.findOne({
        $or: [{ email }, { contact }],
    });

    if (registerdwithemailcontact)
        throw new ApiError(400, "contact and email already registerd");

    //step 4

    const saloon = await Saloon.create({
        saloonName,
        saloonId,
        contact,
        email,
        GSTNumber,
        city,
        location,
        numberOfSeats,
        saloonFor,
        password,
    });

    const createdSaloon = await Saloon.findById(saloon._id).select(
        " -password -refreshToken ",
    );
    if (!createdSaloon)
        throw new ApiError(
            404,
            " something went wrong while register the saloon ",
        );

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                createdSaloon,
                `saloon is registed with GST number ${createdSaloon.GSTNumber}`,
            ),
        );
});

// <-------------LOGIN  SALOON-------->

const saloonLogin = asyncHandler1(async (req, res) => {
    /**
     * 1 extract the login credential from the request body
     * 2 find the existance of In Registed saloon collection
     * 3 validate the password
     * return the Saoon detail with aceess and refresh token
     */

    //step
    const { saloonId, GSTNumber, password } = req.body;
    const email = req.body.email.toLowerCase().trim();

    if (password.length === 0)
        throw new ApiError(400, "password should not empty");

    const saloon = await Saloon.findOne({
        $or: [{ saloonId }, { GSTNumber }, { email }],
    });

    if (!saloon)
        throw new ApiError(404, " saloon is not register  or some error");

    const validPassword = await saloon.isPasswordValid(password);
    if (!validPassword) throw new ApiError(404, " Incorrect Password");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        saloon._id,
    );

    const loginSaloon = await Saloon.findById(saloon._id).select(" -password ");

    const option = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(new ApiResponse(201, loginSaloon, "Saloon is login Succesfully"));
});

//<---------------  LOGOUT SALOON ---------------->

const saloonLogout = asyncHandler1(async (req, res) => {
    await Saloon.findByIdAndUpdate(req.saloon?._id, {
        $unset: {
            refreshToken: 1,
        },
    });

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, " logged Out success"));
});

//<------------------UPDATE PICTTURE --------------------->
const updateSaloonPicture = asyncHandler1(async (req, res) => {
    /**
     * 1 extract the local path of the picture from  local file
     * upload on cloudinary
     * add the cloudinary url of  in data base
     * return the url with response
     */
    let oldPictures;
    try {
        oldPictures = req.body?.oldSaloonPicture;
    } catch (error) {
        console.log("the erroe is ", error);
    }
    const images = req.files?.saloonPicture;

    if (!images) throw new ApiError(401, " the image is required ");

    const uploadmultiple = async () => {
        let ress = [];
        for (const i in images) {
            const result = await uploadOnCloudinary(images[i].path);
            const url = result?.url;
            if (url) ress.push(url);
        }
        return ress;
    };

    const imageUrlList = await uploadmultiple();
    if (!imageUrlList) throw new ApiError(400, "Error while uploading");

    await Saloon.findByIdAndUpdate(
        {
            _id: req.saloon?._id,
        },
        {
            $pull: {
                saloonPictures: {
                    $in: oldPictures,
                },
            },
        },
    );

    const saloon = await Saloon.findByIdAndUpdate(
        {
            _id: req.saloon?._id,
        },
        {
            $push: { saloonPictures: imageUrlList },

            ///  { saloonPicture: imageUrlList },
        },
        {
            new: true,
        },
    ).select(" -password -refreshToken ");

    for (const img in oldPictures) deleteOnCloudnary(oldPictures[img]);

    // for (const imgUrl in oldPictures) console.log(imgUrl);

    return res
        .status(200)
        .json(new ApiResponse(201, saloon, "Image update successfully"));
});

// <--------- RESET SALOON PASSWORD -------------------->
const resetPassword = asyncHandler1(async (req, res) => {
    const oldPassword = req.query?.oldPassword;
    const newPassword = req.query?.newPassword;

    const saloon = await Saloon.findById(req.saloon?._id);

    const isOldPasswordValid = await saloon.isPasswordValid(oldPassword);

    if (!isOldPasswordValid)
        throw new ApiError(404, "Invalid current Password");
    saloon.password = newPassword;

    await saloon.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(201, {}, "Password Change Successfully"));
});

// Registestatino of new barber in saloon

export {
    saloonRegister,
    saloonLogin,
    saloonLogout,
    updateSaloonPicture,
    resetPassword,
};
