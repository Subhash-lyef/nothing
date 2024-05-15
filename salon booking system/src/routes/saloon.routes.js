import router from "express";
import {
    saloonRegister,
    saloonLogin,
    updateSaloonPicture,
    resetPassword,
    saloonLogout,
} from "../controllers/saloon.controller.js";

import { addBarber, removeBarber } from "../controllers/barber.controller.js";

import { verifySaloon } from "../middlewares/auth.saloon.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const saloonRouter = router();

saloonRouter.route("/register").post(saloonRegister);
saloonRouter.route("/login").post(saloonLogin);
saloonRouter.route("/logout").get(verifySaloon, saloonLogout);
saloonRouter.route("/updateSaloonPicture").post(
    verifySaloon,
    upload.fields([
        {
            name: "saloonPicture",
            maxcount: 5,
        },
    ]),
    updateSaloonPicture,
);

saloonRouter.route("/resetPassword").post(verifySaloon, resetPassword);

// barber  related Route

saloonRouter.route("/addBarber").post(
    verifySaloon,
    upload.fields([
        {
            name: "profilePicture",
            maxcount: 1,
        },
    ]),
    addBarber,
);

saloonRouter.route("/removeBarber").delete(verifySaloon, removeBarber);

export { saloonRouter };
