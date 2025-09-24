We configured all the basic and neccessary settings as done in production so that it is easy to implement things

### GOAL1
Setting routes in such a way :
    - making a method in controller (wrapped in a handler) to run when hit a particular url
    - making a route for user registration to call controller on a specific route
    - route declaration in app.js so that to a particular path the control goes to the userRouter middleware then from that the control goes to the controller or say methods.

# ALL SETUP CONFIGURED

### GOAL2: USER REGiSTRATION
    - Handling files before we head to the userRegistration routes, using a middleware in user.routes of multer upload method
    - do the following things as instructed in user.controller.js to register user successfully

### GOAL3: USER LOGIN & LOGOUT
    - Regular Login by considering the instruction
    - Made a middleware to check authenticity of user.
    - Logout Done.

### GOAL4: Refreshing Access Token
    - Checking whether the user is authorized or not with checking it's refresh token
    - generate both access and refresh token and send back to the cookie
    - This results in clear bothering to login repeatedly.

