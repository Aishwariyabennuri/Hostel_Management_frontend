import jwt from "jsonwebtoken";
import { User } from "./models.js";
export async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ message: "Please log in." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.id).select("-passwordHash");
    if (!req.user) return res.status(401).json({ message: "Account not found." });
    next();
  } catch { return res.status(401).json({ message: "Invalid or expired session." }); }
}
export const allow = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({ message: "You do not have permission for this action." });
export const approvedStudent = (req, res, next) => {
  if (req.user.role === "student" && req.user.status !== "approved")
    return res.status(403).json({ message: "Your residency is pending verification." });
  next();
};
