// src/config/multer.js
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// 1. Configurar as credenciais do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// 2. Configurar o Storage para usar o Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'descarte-vivo-uploads',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    // public_id: (req, file) => path.parse(file.originalname).name,
  },
});

const upload = multer({ storage: storage });

export default upload;