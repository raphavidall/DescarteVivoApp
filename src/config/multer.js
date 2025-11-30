// src/config/multer.js
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';

// 1. Configurar as credenciais do Cloudinary
// IMPORTANTE: Em produção (Render), você deve usar Variáveis de Ambiente!
// Localmente, você pode colocar as strings direto ou usar dotenv.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Configure no Render e no .env local
  api_key: process.env.CLOUDINARY_API_KEY,       // Configure no Render e no .env local
  api_secret: process.env.CLOUDINARY_API_SECRET, // Configure no Render e no .env local
});

// 2. Configurar o Storage para usar o Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'descarte-vivo-uploads', // Nome da pasta no seu Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
    // Se quiser manter o nome original (opcional, mas bom para debug):
    // public_id: (req, file) => path.parse(file.originalname).name,
  },
});

const upload = multer({ storage: storage });

export default upload;


// import multer from "multer";
// import path from "path";
// import crypto from "crypto";

// const tmpFolder = path.resolve("uploads");

// export const multerConfig = {
//   directory: tmpFolder,
//   storage: multer.diskStorage({
//     destination: tmpFolder,
//     filename(request, file, callback) {
//       const fileHash = crypto.randomBytes(10).toString("hex");
//       const fileName = `${fileHash}-${file.originalname}`;

//       return callback(null, fileName);
//     },
//   }),
//   fileFilter: (req, file, cb) => {
//     console.log("MIME TYPE RECEBIDO:", file.mimetype);
//     const allowedMimes = [
//       "image/jpeg",
//       "image/pjpeg",
//       "image/png",
//       "image/gif",
//       "image/webp", // Importante para web
//       "image/jpg",
//       "image/bmp"
//     ];

//     if (allowedMimes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       console.error(`Tipo de arquivo rejeitado: ${file.mimetype}`);
//       cb(new Error("Tipo de arquivo inválido. Apenas imagens são permitidas."));
//     }
//   },
// };