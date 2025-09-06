// wrapper for all async routes handling

const asyncHandler = (requestHandler) => 
    // returns a new middleware function that Express can use
    (req, res, next) => {
        // Execute the async handler and convert it to a promise
        Promise.resolve(requestHandler(req, res, next))
            // If the async handler throws an error, catch it
            .catch((err) => next(err)); // Passing the err to Express error handling middleware
}


export default { asyncHandler }