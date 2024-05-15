import mongoose from "mongoose";
import bcrypt from "bcrypt";

const barberSchmem = new mongoose.Schema(
    {
        barberName: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: (v) => {
                    if (v.length > 0) return true;
                    return false;
                },
            },
            meassage: "name is empty",
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
        profilePicture: {
            type: String,
            required: true,
        },
        gender: {
            type: String,
            trim: true,
            enum: ["male", "female", "other"],
            required: true,
        },
        onwork: {
            type: Boolean,
        },
        toSaloon: {
            type: mongoose.Types.ObjectId,
            reg: "Saloon",
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

barberSchmem.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 15);
    next();
});

barberSchmem.methods.isPasswordValid = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// method to generate AccessToken
barberSchmem.methods.generateAccessToken = function () {
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

// method that generate Refresh Token
barberSchmem.methods.generateRefreshToken = function () {
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

export const Barber = mongoose.model("Barber", barberSchmem);
