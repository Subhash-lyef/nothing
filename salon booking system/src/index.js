import connectDB from "./db/index.js";
import dotenv from "dotenv";
import app from "./app.js";
dotenv.config({
    path: "./.env",
});

const port = process.env.PORT;

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("The app error is", error);
            process.exit(1);
        });

        app.listen(port, () => {
            console.log(
                ` The app is listening on adress : http://localhost:${port} `,
            );
        });
    })

    .catch((error) => {
        console.log("connection failed ", error);
    });
