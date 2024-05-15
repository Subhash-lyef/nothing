// import mongoos from 'mongoos';
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            lowercase: true,
            required: true,
            trim: true,
            validate: {
                validator: function (v) {
                    return v.length > 5;
                },
            },
            message: "Name field shouldn't be blank",
        },

        sex: {
            type: String,
            enum: ["male", "female", "other"],
            required: true,
            trim: true,
        },

        mobile: {
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

        email: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        dob: {
            type: Date,
        },

        city: {
            type: String,
            trim: true,
            required: true,
        },
        avatar: {
            type: String,
        },
        refreshToken: {
            type: String,
        },

        cutImage: [{ type: String }],
    },
    { timestamps: true },
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});
userSchema.methods.isPasswordValid = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            mobile: this.mobile,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        },
    );
};
userSchema.methods.generateRefreshToken = function () {
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

export const User = mongoose.model("User", userSchema);
