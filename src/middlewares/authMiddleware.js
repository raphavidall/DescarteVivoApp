import jwt from "jsonwebtoken";
const ACCESS_SECRET = process.env.JWT_SECRET;

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ message: "Token não fornecido" });

  const token = auth.split(" ")[1];

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(403).json({ message: "Token inválido ou expirado" });
  }
}
