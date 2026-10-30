import { v2 as cloudinary } from "cloudinary";

export function uploadImage(buffer) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "smart-hostel/home-visits", resource_type: "image" },
      (error, result) => error ? reject(error) : resolve(result)
    );
    stream.end(buffer);
  });
}