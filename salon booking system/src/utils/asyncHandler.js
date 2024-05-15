// first way to handle async function
const asyncHandler1 = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) =>
            next(err),
        );
    };
};

//second way to handle async funtion

const asyncHandler2 = (func) => async (req, res, next) => {
    try {
        await func();
    } catch (error) {
        res.staus(error.code || 500).json({
            success: false,
            message: error.message,
        });
    }
};

// () => () =>
// the meaning of above line is :
// () => { () => {} }

export { asyncHandler1 };
export { asyncHandler2 };
