import mongoose from "mongoose";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const saloonSchema = new mongoose.Schema(
    {
        saloonName: {
            type: String,
            trim: true,
            required: true,
        },
        saloonId: {
            type: String,
            trim: true,
            required: true,
        },
        contact: [
            {
                type: Number,
                unique: true,
                required: [10, "Enter valid  mobile number"],
                trim: true,
                validate: {
                    validator: (v) => {
                        return /^\d{10}$/.test(v);
                    },
                },
            },
        ],

        email: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            required: true,
        },

        GSTNumber: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        },
        location: {
            type: String,
            trim: true,
            required: true,
        },
        city: {
            type: String,
            trim: true,
            required: true,
        },
        status: {
            type: Boolean,
        },
        numberOfSeats: {
            type: Number,
            enum: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            trim: true,
        },
        saloonFor: {
            type: String,
            enum: ["male", "female", "both"],
            required: true,
        },
        saloonPictures: [
            {
                type: String,
                trim: true,
            },
        ],
        password: {
            type: String,
            required: true,
            trim: true,
        },
        registerdBarber: [
            {
                type: mongoose.Types.ObjectId,
                ref: "Barber",
            },
        ],
        refreshToken: {
            type: String,
        },
    },

    { timestamps: true },
);

// using pre hook before  saving the data into the database
saloonSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 15);
    next();
});

//this method compare the passowrd parametehr with the password in saloon schema
saloonSchema.methods.isPasswordValid = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// method to generate AccessToken
saloonSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            GSTNumber: this.GSTNumber,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        },
    );
};

// method that generate Refresh Token
saloonSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        },
    );
};

export const Saloon = mongoose.model("Saloon", saloonSchema);
