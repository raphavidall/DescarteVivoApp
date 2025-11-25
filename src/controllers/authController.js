import { cons } from "effect/List";
import { authService } from "../services/authService.js";

export const authController = {

  register: async (req, res) => {
    const user = await authService.register(req.body);
    console.log('Register')
    res.status(201).json(user);
  },

  login: async (req, res) => {
    const { email, senha } = req.body;

    const result = await authService.login(email, senha);
    if (!result)
      return res.status(401).json({ message: "Credenciais inválidas" });

    res.json(result);
  },

  refresh: async (req, res) => {
    const { refreshToken } = req.body;

    const newAccess = await authService.refresh(refreshToken);
    if (!newAccess) 
      return res.status(403).json({ message: "Refresh token inválido" });

    res.json({ accessToken: newAccess });
  },

  logout: async (req, res) => {
    await authService.logout(req.userId);
    res.status(200).json({ message: "Logout efetuado" });
  }
};
