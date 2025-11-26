import multer from "multer";
import path from "path";
import crypto from "crypto"; // Para gerar nomes aleatórios

const tmpFolder = path.resolve("uploads");

export const multerConfig = {
  directory: tmpFolder,
  storage: multer.diskStorage({
    destination: tmpFolder,
    filename(request, file, callback) {
      // Gera um hash para o nome do arquivo não repetir
      const fileHash = crypto.randomBytes(10).toString("hex");
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
  // Opcional: Filtro para aceitar apenas imagens
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/pjpeg", "image/png", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo inválido. Apenas imagens são permitidas."));
    }
  },
};