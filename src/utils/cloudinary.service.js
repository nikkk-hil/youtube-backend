import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

// Goal ==> To upload file in cloudinary server from
//          from our localServer using a multer middleware

// Configuration
cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

const uploadOnCloudinary = async (localFilePath) => {
    try {

        if (!localFilePath) return null;

        // console.log(localFilePath);

        const response = await cloudinary.uploader.upload( localFilePath, 
                    {resource_type: "auto"} );

        console.log(`File uploaded successfully, ResponseURL: ${response.url}`);
        fs.unlinkSync(localFilePath);
        return response;

    }  catch (error) {
    console.error("Cloudinary upload error:", error);
    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }
    return null;
}
}

const getPublicId = function(url){
    let publicId = ""

    for (var i = url.length - 5; url[i] != '/'; i--){
        // console.log(url[i]);
        publicId = url[i] + publicId
    }

    // console.log(publicId)
    return publicId
}

const destroyFromCloudinary = async(url) => {
    try {
        const public_id = getPublicId(url)
        // console.log("Public ID: ", public_id);
        const response = await cloudinary.uploader.destroy(public_id);
        return response;
    } catch (error) {
        console.error("Deletion from cloudinary failed!!", error);
    }
}
export { uploadOnCloudinary, destroyFromCloudinary };