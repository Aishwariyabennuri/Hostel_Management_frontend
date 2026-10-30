import { Router } from "express";
import { Announcement, Event, Meeting, Complaint, AuditLog } from "../models.js";
import { auth, allow, approvedStudent } from "../middleware.js";
const router=Router();router.use(auth,approvedStudent);
router.get("/announcements",async(_req,res,next)=>{try{res.json(await Announcement.find({published:true}).sort({publishDate:-1}).limit(100))}catch(e){next(e)}});
router.post("/announcements",allow("admin","warden"),async(req,res,next)=>{try{
 const {slot,message,publishDate}=req.body;
 if(!["morning","afternoon","evening"].includes(slot)||!message||!publishDate)return res.status(400).json({message:"Slot, message and date are required."});
 const item=await Announcement.create({slot,message,publishDate,createdBy:req.user._id});
 await AuditLog.create({actorId:req.user._id,action:"announcement_published",targetType:"Announcement",targetId:String(item._id)});
 res.status(201).json(item);
}catch(e){next(e)}});
router.get("/events",async(_req,res,next)=>{try{res.json(await Event.find({status:{$ne:"draft"}}).sort({date:1}).limit(200))}catch(e){next(e)}});
router.post("/events",allow("admin","warden"),async(req,res,next)=>{try{
 if(!req.body.title)return res.status(400).json({message:"Event title is required."});
 res.status(201).json(await Event.create(req.body));
}catch(e){next(e)}});
router.post("/events/:id/register",allow("student"),async(req,res,next)=>{try{
 const event=await Event.findOne({_id:req.params.id,status:"published",registrationEnabled:true});
 if(!event)return res.status(404).json({message:"Registration is not open for this event."});
 if(!event.registrations.some(id=>String(id)===String(req.user._id)))event.registrations.push(req.user._id);
 await event.save();res.json({message:"Registration recorded.",event});
}catch(e){next(e)}});
router.get("/meetings",async(_req,res,next)=>{try{res.json(await Meeting.find().sort({date:1}).limit(100))}catch(e){next(e)}});
router.post("/meetings",allow("admin","warden"),async(req,res,next)=>{try{res.status(201).json(await Meeting.create(req.body))}catch(e){next(e)}});
router.get("/complaints",async(req,res,next)=>{try{res.json(await Complaint.find(req.user.role==="student"?{studentId:req.user._id}:{}).sort({createdAt:-1}))}catch(e){next(e)}});
router.post("/complaints",allow("student"),async(req,res,next)=>{try{
 if(!req.body.title||!req.body.description)return res.status(400).json({message:"Title and description are required."});
 res.status(201).json(await Complaint.create({...req.body,studentId:req.user._id}));
}catch(e){next(e)}});
router.patch("/complaints/:id",allow("admin","warden"),async(req,res,next)=>{try{
 const item=await Complaint.findByIdAndUpdate(req.params.id,{status:req.body.status,staffRemarks:req.body.staffRemarks},{new:true});
 if(!item)return res.status(404).json({message:"Complaint not found."});res.json(item);
}catch(e){next(e)}});
export default router;
