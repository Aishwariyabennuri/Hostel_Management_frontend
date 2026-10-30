import { Router } from "express";
import mongoose from "mongoose";
import { Hostel, Room, User, AuditLog } from "../models.js";
import { auth, allow } from "../middleware.js";
const router = Router();
router.use(auth);
router.get("/", async (req,res,next) => { try {
  const filter = req.user.role === "warden" ? { wardenIds: req.user._id } : {};
  res.json(await Hostel.find(filter).sort({ name: 1 }));
} catch(e){next(e)} });
router.post("/", allow("admin"), async(req,res,next)=>{try{
 if(!String(req.body.name||"").trim()) return res.status(400).json({message:"Hostel name is required."});
 const hostel=await Hostel.create({name:String(req.body.name).trim(),address:req.body.address});
 await AuditLog.create({actorId:req.user._id,action:"hostel_created",targetType:"Hostel",targetId:String(hostel._id)});
 res.status(201).json(hostel);
}catch(e){next(e)}});
router.get("/rooms", async(req,res,next)=>{try{
 const filter={};
 if(req.query.hostelId) filter.hostelId=req.query.hostelId;
 if(req.user.role==="warden") filter.hostelId={$in:(await Hostel.find({wardenIds:req.user._id}).distinct("_id"))};
 res.json(await Room.find(filter).populate("hostelId","name").sort({roomNumber:1}));
}catch(e){next(e)}});
router.post("/rooms",allow("admin","warden"),async(req,res,next)=>{try{
 const {hostelId,roomNumber,capacity}=req.body;
 if(!hostelId||!roomNumber||!Number.isInteger(Number(capacity))||Number(capacity)<1) return res.status(400).json({message:"Hostel, room number and positive capacity are required."});
 if(!mongoose.isValidObjectId(hostelId)) return res.status(400).json({message:"Select a valid hostel."});
 if(!(await Hostel.exists({_id:hostelId}))) return res.status(404).json({message:"Hostel not found."});
 if(req.user.role==="warden" && !(await Hostel.exists({_id:hostelId,wardenIds:req.user._id}))) return res.status(403).json({message:"This hostel is outside your assignment."});
 const beds=Array.from({length:Number(capacity)},(_,i)=>({bedCode:`${roomNumber}-${i+1}`,occupant:null}));
 const room=await Room.create({...req.body,capacity:Number(capacity),beds});
 res.status(201).json(room);
}catch(e){next(e)}});
router.post("/rooms/:roomId/allocate",allow("admin","warden"),async(req,res,next)=>{try{
 const {studentId,bedCode}=req.body;
 const room=await Room.findById(req.params.roomId);
 if(!room) return res.status(404).json({message:"Room not found."});
 if(req.user.role==="warden" && !(await Hostel.exists({_id:room.hostelId,wardenIds:req.user._id}))) return res.status(403).json({message:"This hostel is outside your assignment."});
 const bed=room.beds.find(b=>b.bedCode===bedCode);
 if(!bed) return res.status(404).json({message:"Bed not found."});
 if(bed.occupant) return res.status(409).json({message:"That bed is already allocated."});
 const student=await User.findOne({...(mongoose.isValidObjectId(studentId)?{_id:studentId}:{studentId}),role:"student",status:"approved"});
 if(!student) return res.status(404).json({message:"Approved student not found."});
 if(await Room.exists({"beds.occupant":student._id})) return res.status(409).json({message:"Student already has an active bed allocation."});
 bed.occupant=student._id; await room.save();
 student.hostelId=room.hostelId; student.roomId=room._id; await student.save();
 await AuditLog.create({actorId:req.user._id,action:"bed_allocated",targetType:"Room",targetId:String(room._id),details:{studentId,bedCode}});
 res.json({room,student:{id:student._id,fullName:student.fullName}});
}catch(e){next(e)}});
router.get("/students",allow("admin","warden"),async(req,res,next)=>{try{
 const filter={role:"student"};
 if(req.user.role==="warden"){
   const hostels=await Hostel.find({wardenIds:req.user._id}).distinct("_id");
   filter.hostelId={$in:hostels};
 }
 if(req.query.search) filter.$or=[{fullName:new RegExp(req.query.search,"i")},{studentId:new RegExp(req.query.search,"i")},{email:new RegExp(req.query.search,"i")}];
 res.json(await User.find(filter).select("-passwordHash").populate("hostelId","name").populate("roomId","roomNumber").limit(300));
}catch(e){next(e)}});
export default router;
