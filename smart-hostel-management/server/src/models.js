import mongoose from "mongoose";
const { Schema, model } = mongoose;
const opts = { timestamps: true };
export const User = model("User", new Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  studentId: { type: String, trim: true, sparse: true, unique: true },
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  mobile: { type: String, trim: true },
  department: String, hostelId: { type: Schema.Types.ObjectId, ref: "Hostel" },
  roomId: { type: Schema.Types.ObjectId, ref: "Room" },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["student", "warden", "admin"], default: "student" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  passwordResetTokenHash: String,
  passwordResetExpiresAt: Date
}, opts));
export const Hostel = model("Hostel", new Schema({
  name: { type: String, required: true }, address: String, wardenIds: [{ type: Schema.Types.ObjectId, ref: "User" }]
}, opts));
export const Room = model("Room", new Schema({
  hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true },
  building: String, floor: Number, roomNumber: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 }, beds: [{ bedCode: String, occupant: { type: Schema.Types.ObjectId, ref: "User", default: null } }]
}, opts));
export const Attendance = model("Attendance", new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true }, slot: { type: String, enum: ["morning","afternoon","evening"], required: true },
  status: { type: String, enum: ["present","absent","late"], required: true }, markedBy: { type: Schema.Types.ObjectId, ref: "User" }
}, opts));
export const OutsideRequest = model("OutsideRequest", new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, required: true }, destination: { type: String, required: true },
  departureAt: { type: Date, required: true }, expectedReturnAt: { type: Date, required: true },
  actualDepartureAt: Date, actualReturnAt: Date, notes: String, remarks: String,
  status: { type: String, enum: ["pending","approved","rejected","outside","returned"], default: "pending" },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" }
}, opts));
export const HomeVisit = model("HomeVisit", new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reason: String, departureAt: Date, expectedReturnAt: Date, actualReturnAt: Date,
  status: { type: String, enum: ["pending","approved","rejected","returned","clarification"], default: "pending" },
  photoPath: String, exceptionReason: String, reviewedBy: { type: Schema.Types.ObjectId, ref: "User" }
}, opts));
export const Announcement = model("Announcement", new Schema({
  slot: { type: String, enum: ["morning","afternoon","evening"], required: true },
  message: { type: String, required: true }, publishDate: { type: Date, required: true },
  published: { type: Boolean, default: true }, createdBy: { type: Schema.Types.ObjectId, ref: "User" }
}, opts));
export const Meeting = model("Meeting", new Schema({
  title: String, agenda: String, date: Date, organizer: String, participants: [String],
  attendance: [{ userId: Schema.Types.ObjectId, present: Boolean }], minutes: String,
  meetingLink: String, status: { type: String, default: "scheduled" }
}, opts));
export const Event = model("Event", new Schema({
  title: { type: String, required: true }, description: String, category: String,
  date: Date, time: String, venue: String, organizer: String, posterPath: String,
  registrationDeadline: Date, registrationEnabled: { type: Boolean, default: false },
  registrations: [{ type: Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["draft","published","cancelled","completed"], default: "published" }
}, opts));
export const Complaint = model("Complaint", new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: String, description: String, category: String,
  status: { type: String, enum: ["open","in_progress","resolved","rejected"], default: "open" },
  staffRemarks: String
}, opts));
export const FeeRecord = model("FeeRecord", new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  hostelId: { type: Schema.Types.ObjectId, ref: "Hostel" }, roomId: { type: Schema.Types.ObjectId, ref: "Room" },
  feeType: String, totalAmount: { type: Number, required: true, min: 0 },
  dueDate: Date, staffRemarks: String,
  payments: [{ amount: { type: Number, required: true, min: 0 }, date: Date, method: String, receiptReference: String, recordedBy: Schema.Types.ObjectId }]
}, opts));
export const AuditLog = model("AuditLog", new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: "User" }, action: String, targetType: String,
  targetId: String, details: Schema.Types.Mixed
}, opts));
export const MessMenu = model("MessMenu", new Schema({
  dayOfWeek: { type: String, enum: ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"], required: true },
  date: Date, meal: { type: String, enum: ["breakfast","lunch","snacks","dinner"], required: true },
  items: [{ type: String, trim: true }], notes: String, createdBy: { type: Schema.Types.ObjectId, ref: "User" }
}, opts));
export const DirectMessage = model("DirectMessage", new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: "User" },
  targetRole: { type: String, enum: ["student","warden","admin"] },
  subject: { type: String, required: true, maxlength: 150 },
  body: { type: String, required: true, maxlength: 4000 },
  readAt: Date
}, opts));
export const HostelNotification = model("HostelNotification", new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true }, message: { type: String, required: true },
  type: { type: String, default: "general" }, readAt: Date, createdBy: { type: Schema.Types.ObjectId, ref: "User" }
}, opts));
