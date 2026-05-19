const express = require("express");
const router = express.Router();
const {
  submitComplaint,
  getAllComplaints,
  updateComplaint,
  searchComplaints,
  deleteComplaint,
  getComplaintById,
} = require("../controllers/complaintTestController");

const { detectUrgency, suggestDepartment, generateAutoResponse, generateSummary } = require("../controllers/aiController");

// 4. Search Complaint by Location
// GET /api/complaints/search?location=Ghaziabad
router.get("/search", searchComplaints);

// 1. Add Complaint
// POST /api/complaints
router.post("/", submitComplaint);

// 2. Get All Complaints
// GET /api/complaints
router.get("/", getAllComplaints);

// 3. Update Complaint Status
// PUT /api/complaints/:id
router.put("/:id", updateComplaint);

// 5. Delete Complaint
// DELETE /api/complaints/:id
router.delete("/:id", deleteComplaint);

// 6. GET /api/complaints/:id
router.get("/:id", getComplaintById);

// 7. POST /api/complaints/:id/analyze  (inline AI)
router.post("/:id/analyze", async (req, res) => {
  try {
    const complaint = await require("../models/ComplaintTest").findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    
    const urgency = detectUrgency(complaint.title, complaint.description);
    const suggestedDepartment = suggestDepartment(complaint.category, complaint.title, complaint.description);
    const autoResponse = generateAutoResponse(complaint.title, complaint.category, urgency, suggestedDepartment);
    const summary = generateSummary(complaint.title, complaint.description, complaint.category, complaint.location || "Unknown");
    
    complaint.aiAnalysis = { urgency, suggestedDepartment, autoResponse, summary, analyzedAt: new Date() };
    await complaint.save();
    
    res.json({ success: true, analysis: complaint.aiAnalysis, complaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
