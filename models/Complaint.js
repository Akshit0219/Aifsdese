const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Complainant name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },

    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "Infrastructure",
          "Academic",
          "Financial",
          "Harassment",
          "Technical",
          "Transport",
          "Hostel",
          "Other",
        ],
        message: "Invalid category",
      },
    },

    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },

    status: {
      type: String,
      enum: {
        values: ["Pending", "In Progress", "Resolved", "Rejected"],
        message: "Status must be: Pending, In Progress, Resolved, or Rejected",
      },
      default: "Pending",
    },

    // AI Analysis Results (populated after AI analysis)
    aiAnalysis: {
      urgency: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
        default: null,
      },
      suggestedDepartment: {
        type: String,
        default: null,
      },
      autoResponse: {
        type: String,
        default: null,
      },
      summary: {
        type: String,
        default: null,
      },
      analyzedAt: {
        type: Date,
        default: null,
      },
    },

    // Reference to the User who filed this complaint
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
complaintSchema.index({ title: "text", description: "text", location: "text" });

module.exports = mongoose.model("Complaint", complaintSchema);
