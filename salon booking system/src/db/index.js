// this file actually established the connection with
// the database and allow the expot feature for the other file

import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectInstances = await mongoose.connect(
            `${process.env.MONGODB_URL}/${process.env.DATABASE_NAME}`,
        );
        console.log("MONGODB connected", connectInstances.connection.host);
    } catch (error) {
        console.log("MONGODB connnection FAILED : ", error);
        process.exit(1);
    }
};

export default connectDB;
