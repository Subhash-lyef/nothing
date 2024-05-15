import mongoose from "mongoose";

const clientRequestSchma = mongoose.Schema(
    {
        clientId: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },
        saloonId: {
            type: mongoose.Types.ObjectId,
            ref: "Saloon",
            required: true,
        },
        requestFor: [
            {
                type: String,
                trim: true,
                required: true,
            },
        ],
        slotbook: {
            type: Boolean,
            default: false,
            required: true,
        },
        waitTime: {
            type: date,
            default: "$$NOW",
        },
    },
    {
        timestamps: true,
    },
);

export const ClientRequest = mongoose.model(
    "ClientRequest",
    clientRequestSchma,
);
