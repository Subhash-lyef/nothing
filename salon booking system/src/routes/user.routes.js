import router from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    updateAvatar,
    changePassword,
} from "../controllers/user.controller.js";
// import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = router();

userRouter.route("/register").post(registerUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/updateAvatar").post(
    verifyJWT,
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
    ]),

    updateAvatar,
);

userRouter.route("/changePassword").post(verifyJWT, changePassword);

export { userRouter };
