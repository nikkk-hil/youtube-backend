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

        const response = await cloudinary.uploader
            .upload( localFilePath, 
                    {resource_type: "auto"} );

        console.log(`File uploaded successfully, ResponseURL: ${response.url}`);
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath); //remove locally saved temporary file as the upload operation got failed!!
        return null;
    }
}

export { uploadOnCloudinary };