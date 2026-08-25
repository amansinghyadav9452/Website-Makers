const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDF, and text files allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

async function optimizeImage(buffer, options = {}) {
  const { width = 1200, height = 1200, quality = 80, format = 'webp' } = options;

  let pipeline = sharp(buffer)
    .resize(width, height, { fit: 'inside', withoutEnlargement: true });

  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({ quality, progressive: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
      break;
    default:
      pipeline = pipeline.webp({ quality });
  }

  return pipeline.toBuffer();
}

function getFileExtension(mimetype) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
  };
  return map[mimetype] || 'bin';
}

module.exports = { upload, optimizeImage, getFileExtension };
