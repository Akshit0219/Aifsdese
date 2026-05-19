const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  submitComplaint,
  getAllComplaints,
  searchComplaints,
  getComplaintById,
  updateComplaintStatus,
  updateComplaint,
  deleteComplaint,
} = require("../controllers/complaintController");
const {
  analyzeComplaint,
  getAnalysis,
} = require("../controllers/aiController");

// ⚠️  /search MUST come before /:id
router.get("/search", protect, searchComplaints);

// POST /api/complaints                   → Submit complaint
router.post("/", protect, submitComplaint);

// GET  /api/complaints                   → Get all (with filters)
router.get("/", protect, getAllComplaints);

// GET  /api/complaints/:id               → Get complaint by ID
router.get("/:id", protect, getComplaintById);

// PUT  /api/complaints/:id               → Update complaint
router.put("/:id", protect, updateComplaint);

// PUT  /api/complaints/:id/status        → Update complaint status
router.put("/:id/status", protect, updateComplaintStatus);

// POST /api/complaints/:id/analyze       → Run AI analysis
router.post("/:id/analyze", protect, analyzeComplaint);

// GET  /api/complaints/:id/analysis      → Get AI analysis results
router.get("/:id/analysis", protect, getAnalysis);

// DELETE /api/complaints/:id             → Delete complaint
router.delete("/:id", protect, deleteComplaint);

module.exports = router;
