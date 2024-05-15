import { upload } from "../middlewares/multer.middleware.js";
import { ApiError } from "../utils/APIError.js";
import { ApiResponse } from "../utils/APIResponse.js";
import { asyncHandler1 } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { Saloon } from "../models/saloon.model.js";
import { Barber } from "../models/barber.model.js";
import { mongoose } from "mongoose";

const addBarber = asyncHandler1(async (req, res) => {
    /*
     * 1 extract the deatial of the user.
     * 2 verify the valid formate of the deatial
     * 3 check wherther barbar already exitsted or not  with mobile number
     *    upload the profilePicture into the cloudinary
     * 4 the add barber in barber collectipon
     * 5 the link the barber to the saloon
     */

    const { barberName, mobile, gender, password } = req.body;
    const toSaloon = req.saloon?._id;

    // step 2
    const existedBarbr = await Barber.findOne({ mobile });
    if (existedBarbr) throw new ApiError(404, "Barber Already Registerd ");

    const profilePictureLocalPath = req.files?.profilePicture[0].path;

    if (!profilePictureLocalPath)
        throw new ApiError(400, "profile Picture not Attached");

    const uploadPicture = await uploadOnCloudinary(profilePictureLocalPath);

    if (!uploadPicture)
        throw new ApiError(
            404,
            " something Went wrong while uploading on cloudinary",
        );

    const profilePicture = uploadPicture.url;
    const barber = await Barber.create({
        barberName,
        mobile,
        gender,
        profilePicture,
        toSaloon,
        password,
    });

    // now adding the registerd barber into the saloon

    if (!barber)
        throw new ApiError(
            400,
            "Something went wrong while register the barber into the database",
        );
    const barberId = new mongoose.Types.ObjectId(barber._id);
    console.log(req.saloon._id);
    console.log(barberId);

    const saloon = await Saloon.findByIdAndUpdate(req.saloon._id, {
        $push: {
            registerdBarber: new mongoose.Types.ObjectId(barber._id),
        },
    });

    const updatedSaloon = await Saloon.findById(saloon._id).select(
        "-password -refreshToken",
    );

    updatedSaloon.barber = barber;

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                { updatedSaloon, barber },
                " added new barber Registerd",
            ),
        );
});

const removeBarber = asyncHandler1(async (req, res) => {
    /**
     * 1 extract the barber Id from the request
     * 2 try to find the wherther barberid is exist in saloon registerbarber list
     * 3 then delete the barber from the Barbers collection
     * 4 pull the barber id from saloon registerdBarber list
     * 5 return the response for the deleted barber
     */
    const barberId = new mongoose.Types.ObjectId(req.query?.barberId);
    if (!barberId) throw new ApiError(400, " Barber Id required");
    console.log(barberId);

    const toSaloon = new mongoose.Types.ObjectId(req.saloon?._id);
    console.log(toSaloon);

    const barber = await Barber.findOneAndDelete(
        {
            $and: [{ toSaloon }, { _id: barberId }],
        },
        { new: true },
    );

    if (!barber) throw new ApiError(400, "barber not registerd ");

    const updatedSaloon = await Saloon.findByIdAndUpdate(
        toSaloon,
        {
            $pull: { registerdBarber: barberId },
        },
        {
            new: true,
        },
    ).select(" -password  -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(201, { updatedSaloon, barber }, "removed"));
});

export { addBarber, removeBarber };
