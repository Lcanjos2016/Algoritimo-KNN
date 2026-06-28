import { getUserFromToken } from "../services/auth.js";

export async function requireAuth(request, response, next) {
  const token = request.headers.authorization?.replace("Bearer ", "");
  const user = await getUserFromToken(token);

  if (!user) {
    return response.status(401).json({ message: "Autenticacao obrigatoria." });
  }

  request.user = user;
  return next();
}
