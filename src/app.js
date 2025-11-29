import path from 'path';
import express from "express";
import cors from "cors";
import "express-async-errors";

// Import Rotas
import authRoutes from "./routes/authRoutes.js";
import usuariosRoutes from "./routes/usuarioRoutes.js";
import pacotesRoutes from "./routes/pacoteRoutes.js";
import materiaisRoutes from "./routes/materialRoutes.js";
import lojaRoutes from "./routes/lojaRoutes.js";
import mensagensRoutes from "./routes/mensagemRoutes.js";
import transacoesRoutes from "./routes/transacaoRoutes.js";
import notificacoesRoutes from "./routes/notificacaoRoutes.js";

// Import Middlewares
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve('uploads')));

// Rotas
app.use("/auth", authRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/pacotes", pacotesRoutes);
app.use("/materiais", materiaisRoutes);
app.use("/loja", lojaRoutes);
app.use("/mensagens", mensagensRoutes);
app.use("/transacoes", transacoesRoutes);
app.use("/notificacoes", notificacoesRoutes);

// Middlewares
app.use(errorMiddleware);

export default app;
