import multer from "multer";
import path from "path";
import crypto from "crypto";

const tmpFolder = path.resolve("uploads");

export const multerConfig = {
  directory: tmpFolder,
  storage: multer.diskStorage({
    destination: tmpFolder,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString("hex");
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
  fileFilter: (req, file, cb) => {
    console.log("MIME TYPE RECEBIDO:", file.mimetype);
    const allowedMimes = [
      "image/jpeg",
      "image/pjpeg",
      "image/png",
      "image/gif",
      "image/webp", // Importante para web
      "image/jpg",
      "image/bmp"
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.error(`Tipo de arquivo rejeitado: ${file.mimetype}`);
      cb(new Error("Tipo de arquivo inválido. Apenas imagens são permitidas."));
    }
  },
};