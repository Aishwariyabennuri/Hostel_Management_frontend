import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { OutsideRequest, HomeVisit, AuditLog, Hostel } from "../models.js";
import { auth, allow, approvedStudent } from "../middleware.js";
const router=Router(); router.use(auth,approvedStudent);
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const uploadDir=path.resolve(__dirname,"../../uploads");fs.mkdirSync(uploadDir,{recursive:true});
const photoUpload=multer({storage:multer.diskStorage({destination:(_req,_file,cb)=>cb(null,uploadDir),filename:(_req,file,cb)=>cb(null,`${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)}),limits:{fileSize:5*1024*1024},fileFilter:(_req,file,cb)=>{const ok=["image/jpeg","image/png","image/webp"].includes(file.mimetype);cb(ok?null:new Error("Upload a JPG, PNG or WEBP image."),ok);}});
router.get("/outside",async(req,res,next)=>{try{
 const filter=req.user.role==="student"?{studentId:req.user._id}:{};
 if(req.user.role==="warden"){
  const ids=await Hostel.find({wardenIds:req.user._id}).distinct("_id");
  filter.studentId={$in:await (await import("../models.js")).User.find({hostelId:{$in:ids}}).distinct("_id")};
 }
 res.json(await OutsideRequest.find(filter).populate("studentId","fullName studentId hostelId").sort({createdAt:-1}));
}catch(e){next(e)}});
router.post("/outside",allow("student"),async(req,res,next)=>{try{
 const {reason,destination,departureAt,expectedReturnAt,notes}=req.body;
 if(!reason||!destination||!departureAt||!expectedReturnAt||new Date(expectedReturnAt)<=new Date(departureAt)) return res.status(400).json({message:"Provide reason, destination and a valid return time after departure."});
 res.status(201).json(await OutsideRequest.create({studentId:req.user._id,reason,destination,departureAt,expectedReturnAt,notes}));
}catch(e){next(e)}});
router.patch("/outside/:id/review",allow("admin","warden"),async(req,res,next)=>{try{
 const {status,remarks}=req.body;
 if(!["approved","rejected"].includes(status)) return res.status(400).json({message:"Choose approved or rejected."});
 const request=await OutsideRequest.findById(req.params.id);
 if(!request) return res.status(404).json({message:"Request not found."});
 if(req.user.role==="warden" && !(await Hostel.exists({_id:req.user.hostelId,wardenIds:req.user._id}))) {
   const {User}=await import("../models.js"); const student=await User.findById(request.studentId);
   if(!student || !(await Hostel.exists({_id:student.hostelId,wardenIds:req.user._id}))) return res.status(403).json({message:"Not authorized for this student."});
 }
 request.status=status;request.remarks=remarks;request.reviewedBy=req.user._id;await request.save();
 await AuditLog.create({actorId:req.user._id,action:`outside_${status}`,targetType:"OutsideRequest",targetId:String(request._id)});
 res.json(request);
}catch(e){next(e)}});
router.patch("/outside/:id/returned",allow("admin","warden"),async(req,res,next)=>{try{
 const request=await OutsideRequest.findById(req.params.id);
 if(!request) return res.status(404).json({message:"Request not found."});
 request.status="returned";request.actualReturnAt=new Date();await request.save();res.json(request);
}catch(e){next(e)}});
router.get("/home-visits",async(req,res,next)=>{try{res.json(await HomeVisit.find(req.user.role==="student"?{studentId:req.user._id}:{}).sort({createdAt:-1}))}catch(e){next(e)}});
router.post("/home-visits",allow("student"),async(req,res,next)=>{try{
 const {reason,departureAt,expectedReturnAt}=req.body;
 if(!departureAt||!expectedReturnAt||new Date(expectedReturnAt)<=new Date(departureAt)) return res.status(400).json({message:"Choose a valid departure and return time."});
 res.status(201).json(await HomeVisit.create({studentId:req.user._id,reason,departureAt,expectedReturnAt}));
}catch(e){next(e)}});

router.post("/home-visits/:id/photo",allow("student"),photoUpload.single("photo"),async(req,res,next)=>{try{
 if(!req.file)return res.status(400).json({message:"Choose a photo to upload."});
 const visit=await HomeVisit.findOne({_id:req.params.id,studentId:req.user._id});
 if(!visit){fs.unlink(req.file.path,()=>{});return res.status(404).json({message:"Home visit not found."});}
 if(visit.status!=="approved"){fs.unlink(req.file.path,()=>{});return res.status(400).json({message:"The home visit must be approved before arrival verification."});}
 visit.photoPath=req.file.filename;visit.actualReturnAt=new Date();visit.status="returned";await visit.save();
 res.json({message:"Arrival photo submitted securely for hostel staff review.",homeVisit:{id:visit._id,status:visit.status,actualReturnAt:visit.actualReturnAt,photoSubmitted:true}});
}catch(e){if(req.file)fs.unlink(req.file.path,()=>{});next(e)}});
router.get("/home-visits/:id/photo",async(req,res,next)=>{try{
 const visit=await HomeVisit.findById(req.params.id);if(!visit||!visit.photoPath)return res.status(404).json({message:"Photo not found."});
 if(req.user.role==="student"&&String(visit.studentId)!==String(req.user._id))return res.status(403).json({message:"You cannot access this photo."});
 if(req.user.role==="warden"){const {User}=await import("../models.js");const student=await User.findById(visit.studentId);if(!student||!(await Hostel.exists({_id:student.hostelId,wardenIds:req.user._id})))return res.status(403).json({message:"This student is outside your assigned hostel."});}
 res.sendFile(path.join(uploadDir,visit.photoPath));
}catch(e){next(e)}});
router.patch("/home-visits/:id/review",allow("admin","warden"),async(req,res,next)=>{try{
 const {status,exceptionReason}=req.body;
 if(!["approved","rejected","clarification"].includes(status)) return res.status(400).json({message:"Invalid review status."});
 const visit=await HomeVisit.findById(req.params.id);if(!visit)return res.status(404).json({message:"Visit not found."});
 if(req.user.role==="warden"){const {User}=await import("../models.js");const student=await User.findById(visit.studentId);if(!student||!(await Hostel.exists({_id:student.hostelId,wardenIds:req.user._id})))return res.status(403).json({message:"This student is outside your assigned hostel."});}
 visit.status=status;visit.exceptionReason=exceptionReason;visit.reviewedBy=req.user._id;await visit.save();res.json(visit);
}catch(e){next(e)}});
export default router;
