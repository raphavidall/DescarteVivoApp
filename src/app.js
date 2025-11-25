import "express-async-errors";
import express from "express";
import cors from "cors";

// Import Rotas
import authRoutes from "./routes/authRoutes.js";
import usuariosRoutes from "./routes/usuarioRoutes.js";
import pacotesRoutes from "./routes/pacoteRoutes.js";
import materiaisRoutes from "./routes/materialRoutes.js";
import lojaRoutes from "./routes/lojaRoutes.js";
import mensagensRoutes from "./routes/mensagemRoutes.js";
import transacoesRoutes from "./routes/transacaoRoutes.js";

// Import Middlewares
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use("/auth", authRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/pacotes", pacotesRoutes);
app.use("/materiais", materiaisRoutes);
app.use("/loja", lojaRoutes);
app.use("/mensagens", mensagensRoutes);
app.use("/transacoes", transacoesRoutes)

// Middlewares
app.use(errorMiddleware);

export default app;
