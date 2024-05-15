import { ApiError } from "../utils/APIError.js";
import { asyncHandler1 } from "../utils/asyncHandler.js";
import { Saloon } from "../models/saloon.model.js";
import jwt from "jsonwebtoken";

const verifySaloon = asyncHandler1(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodetoken = await jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
        );

        const saloon = await Saloon.findById(decodetoken?._id).select(
            " -password -refreshToken ",
        );

        if (!saloon) throw new ApiError(401, "Invalid Access Token");

        req.saloon = saloon;

        next();
    } catch (error) {
        throw new ApiError(
            400,
            `Error is catch while verifying sallon in catch block & ${error}`,
        );
    }
});

export { verifySaloon };
