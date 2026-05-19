const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { analyzeComplaint, getAnalysis } = require("../controllers/aiController");

// POST /api/ai/analyze
// Accepts complaint data in request body and returns AI analysis
router.post("/analyze", async (req, res) => {
  // Pass to a wrapper in aiController or define inline
  try {
    const { title, description, category, location } = req.body;
    
    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: "Missing required fields for analysis" });
    }

    // Load AI logic
    const { detectUrgency, suggestDepartment, generateAutoResponse, generateSummary } = require("../controllers/aiController");
    
    const urgency = detectUrgency(title, description);
    const suggestedDepartment = suggestDepartment(category, title, description);
    const autoResponse = generateAutoResponse(title, category, urgency, suggestedDepartment);
    const summary = generateSummary(title, description, category, location || "Unknown");

    res.status(200).json({
      success: true,
      analysis: {
        urgency,
        suggestedDepartment,
        autoResponse,
        summary,
        analyzedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
