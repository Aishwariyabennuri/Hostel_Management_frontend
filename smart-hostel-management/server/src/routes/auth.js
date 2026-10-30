import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { User, AuditLog } from "../models.js";
import { auth, allow } from "../middleware.js";
const router = Router();
const safe = u => ({ id: u._id, fullName: u.fullName, email: u.email, studentId: u.studentId, role: u.role, status: u.status, hostelId: u.hostelId, roomId: u.roomId });
const mailer = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) throw new Error("Password reset email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASSWORD.");
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "true", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
};
router.post("/signup", async (req, res, next) => {
  try {
    const { fullName, studentId, email, mobile, department, password, confirmPassword } = req.body;
    if (!fullName || !studentId || !email || !password) return res.status(400).json({ message: "Name, student ID, email and password are required." });
    if (password.length < 8) return res.status(400).json({ message: "Password must contain at least 8 characters." });
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match." });
    if (await User.findOne({ $or: [{ email: email.toLowerCase() }, { studentId }] })) return res.status(409).json({ message: "That email or student ID is already registered." });
    const user = await User.create({ fullName, studentId, email, mobile, department, passwordHash: await bcrypt.hash(password, 12), role: "student", status: "pending" });
    res.status(201).json({ message: "Registration submitted. A warden/admin must verify your residency before you can access student records.", user: safe(user) });
  } catch (e) { next(e); }
});
router.post("/login", async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({ $or: [{ email: String(identifier || "").toLowerCase() }, { studentId: identifier }] });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) return res.status(401).json({ message: "Invalid ID/email or password." });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, user: safe(user) });
  } catch (e) { next(e); }
});
router.post("/forgot-password", async (req, res, next) => {
  try {
    const identifier = String(req.body.identifier || "").trim().toLowerCase();
    const user = await User.findOne({ $or: [{ email: identifier }, { studentId: req.body.identifier }] });
    if (!user) return res.json({ message: "If an account matches that email or student ID, a reset link has been sent." });
    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    const resetUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/reset-password?token=${token}`;
    await mailer().sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: user.email, subject: "Reset your Haven password", text: `Use this link to reset your Haven password (expires in 30 minutes): ${resetUrl}`, html: `<p>Use the link below to reset your Haven password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>` });
    res.json({ message: "If an account matches that email or student ID, a reset link has been sent." });
  } catch (e) { next(e); }
});
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token || !password || password.length < 8 || password !== confirmPassword) return res.status(400).json({ message: "Provide matching passwords with at least 8 characters." });
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ passwordResetTokenHash: hash, passwordResetExpiresAt: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: "This reset link is invalid or expired." });
    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (e) { next(e); }
});
router.get("/me", auth, async (req, res, next) => { try { const user = await User.findById(req.user._id).populate("hostelId", "name").populate("roomId", "roomNumber"); res.json({ user: safe(user) }); } catch (e) { next(e); } });
router.get("/pending", auth, allow("admin","warden"), async (_req, res, next) => {
  try { res.json(await User.find({ role: "student", status: "pending" }).select("-passwordHash").sort({ createdAt: -1 })); } catch (e) { next(e); }
});
router.patch("/:id/approval", auth, allow("admin","warden"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["approved","rejected"].includes(status)) return res.status(400).json({ message: "Status must be approved or rejected." });
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: "student", status: "pending" }, { status, approvedBy: req.user._id }, { new: true }).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "Pending student not found." });
    await AuditLog.create({ actorId: req.user._id, action: `student_${status}`, targetType: "User", targetId: String(user._id) });
    res.json({ user });
  } catch (e) { next(e); }
});
router.post("/logout", (_req, res) => res.json({ message: "Logged out. Remove the token from this browser." }));
export default router;
