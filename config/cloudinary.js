const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image to Cloudinary
const uploadImage = async (file, folder = 'dentist-website') => {
  try {
    // Validate file
    if (!file || !file.buffer) {
      throw new Error('Invalid file provided');
    }

    // Convert buffer to data URI for Cloudinary
    const dataUri = `data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`;
    
    console.log('Uploading to Cloudinary:', {
      folder,
      mimetype: file.mimetype,
      size: file.buffer.length
    });
    
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });
    
    console.log('Cloudinary upload successful:', {
      public_id: result.public_id,
      url: result.secure_url
    });
    
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image');
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage
};
