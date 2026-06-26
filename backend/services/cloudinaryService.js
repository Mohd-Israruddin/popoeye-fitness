const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function uploadMemberPhoto(buffer, memberId) {
  const folder = process.env.CLOUDINARY_FOLDER || 'gym-members';
  const publicId = memberId ? `member-${memberId}-${Date.now()}` : `member-${Date.now()}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'thumb', gravity: 'face', zoom: 0.85 },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('Cloudinary delete failed:', err.message);
  }
}

function getPublicIdFromUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match ? match[1] : null;
}

module.exports = {
  isConfigured,
  uploadMemberPhoto,
  deleteImage,
  getPublicIdFromUrl,
};
