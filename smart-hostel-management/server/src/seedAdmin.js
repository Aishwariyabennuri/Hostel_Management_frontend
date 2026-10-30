import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./models.js";
dotenv.config();
if(!process.env.MONGO_URI||!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD) throw new Error("Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env");
await mongoose.connect(process.env.MONGO_URI);
const existing=await User.findOne({role:"admin"});
if(existing) console.log("An admin already exists; no changes made.");
else {
 await User.create({fullName:process.env.ADMIN_NAME||"Administrator",email:process.env.ADMIN_EMAIL.toLowerCase(),passwordHash:await bcrypt.hash(process.env.ADMIN_PASSWORD,12),role:"admin",status:"approved"});
 console.log("Initial admin created for",process.env.ADMIN_EMAIL);
}
await mongoose.disconnect();
