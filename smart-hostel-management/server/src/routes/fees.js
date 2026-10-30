import { Router } from "express";
import mongoose from "mongoose";
import { FeeRecord, AuditLog, User } from "../models.js";
import { auth, allow, approvedStudent } from "../middleware.js";
const router=Router();router.use(auth,approvedStudent);
const shape=f=>{
 const paid=f.payments.reduce((sum,p)=>sum+p.amount,0), balance=Math.max(0,f.totalAmount-paid);
 let status=balance===0?"Paid":(f.dueDate&&new Date(f.dueDate)<new Date()?"Overdue":(paid>0?"Partially Paid":"Pending"));
 return {...f.toObject(),amountPaid:paid,balance,status};
};
router.get("/",async(req,res,next)=>{try{
 const filter=req.user.role==="student"?{studentId:req.user._id}:{};
 const docs=await FeeRecord.find(filter).populate("studentId","fullName studentId").sort({dueDate:1});
 res.json(docs.map(shape));
}catch(e){next(e)}});
router.post("/",allow("admin","warden"),async(req,res,next)=>{try{
 const {studentId,totalAmount,feeType,dueDate}=req.body;
 if(!studentId||!feeType||!Number.isFinite(Number(totalAmount))||Number(totalAmount)<0)return res.status(400).json({message:"Student, fee type and valid total amount are required."});
 const student=await User.findOne({role:"student",...(mongoose.isValidObjectId(studentId)?{_id:studentId}:{studentId})});
 if(!student)return res.status(404).json({message:"Student not found. Enter a valid student ID or user ID."});
 res.status(201).json(shape(await FeeRecord.create({studentId:student._id,totalAmount:Number(totalAmount),feeType,dueDate,hostelId:req.body.hostelId||student.hostelId,roomId:req.body.roomId||student.roomId,staffRemarks:req.body.staffRemarks})));
}catch(e){next(e)}});
router.post("/:id/payments",allow("admin","warden"),async(req,res,next)=>{try{
 const {amount,date,method,receiptReference}=req.body;
 if(!Number.isFinite(Number(amount))||Number(amount)<=0)return res.status(400).json({message:"Payment amount must be greater than zero."});
 const fee=await FeeRecord.findById(req.params.id);
 if(!fee)return res.status(404).json({message:"Fee record not found."});
 const current=fee.payments.reduce((s,p)=>s+p.amount,0);
 if(current+Number(amount)>fee.totalAmount)return res.status(400).json({message:"Recorded payments cannot exceed the total fee."});
 fee.payments.push({amount:Number(amount),date:date||new Date(),method,receiptReference,recordedBy:req.user._id});
 await fee.save();await AuditLog.create({actorId:req.user._id,action:"fee_payment_recorded",targetType:"FeeRecord",targetId:String(fee._id),details:{amount:Number(amount)}});
 res.json(shape(fee));
}catch(e){next(e)}});
export default router;
