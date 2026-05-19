const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Validation error: Missing name field"],
  },
  email: {
    type: String,
    required: [true, "Validation error: Missing email field"],
    match: [/^\S+@\S+\.\S+$/, "Invalid email"],
  },
  title: {
    type: String,
    required: [true, "Validation error"], // Expected error in test
  },
  description: {
    type: String,
    required: [true, "Validation error: Missing description field"],
  },
  category: {
    type: String,
    required: [true, "Validation error: Missing category field"],
  },
  location: {
    type: String,
    required: [true, "Validation error: Missing location field"],
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Resolved", "Rejected"],
    default: "Pending",
  },
  aiAnalysis: {
    urgency:             { type: String, default: null },
    suggestedDepartment: { type: String, default: null },
    autoResponse:        { type: String, default: null },
    summary:             { type: String, default: null },
    analyzedAt:          { type: Date,   default: null },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  }
}, { timestamps: false });

module.exports = mongoose.model("ComplaintTest", ComplaintSchema);
