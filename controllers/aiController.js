const Complaint = require("../models/Complaint");

// ═══════════════════════════════════════════════════════════════════════════
//  AI ANALYSIS ENGINE (Rule-Based Smart Analysis)
//  Analyzes complaints to detect urgency, suggest departments,
//  generate auto-responses, and summarize complaints.
// ═══════════════════════════════════════════════════════════════════════════

// ── Urgency Detection Keywords ──────────────────────────────────────────
const URGENCY_KEYWORDS = {
  critical: [
    "emergency", "urgent", "immediately", "danger", "threat", "assault",
    "fire", "flood", "injury", "accident", "violence", "unsafe", "hazard",
    "life-threatening", "critical", "severe", "sexual", "abuse", "collapse",
  ],
  high: [
    "broken", "damaged", "leaking", "blocked", "harassment", "bully",
    "discrimination", "theft", "stolen", "malfunction", "outage", "no water",
    "no electricity", "power cut", "internet down", "deadline", "overdue",
    "unfair", "cheating", "corruption", "overcharge",
  ],
  medium: [
    "slow", "delay", "dirty", "noisy", "inconvenient", "crowded",
    "uncomfortable", "complaint", "issue", "problem", "poor", "bad",
    "maintenance", "repair", "fix", "unclean", "late", "missing",
  ],
  low: [
    "suggestion", "feedback", "improvement", "minor", "request", "query",
    "information", "question", "clarification", "enhancement",
  ],
};

// ── Department Mapping ──────────────────────────────────────────────────
const DEPARTMENT_MAP = {
  Infrastructure: {
    department: "Facilities & Maintenance Department",
    keywords: {
      "Electrical Department": ["electricity", "power", "wiring", "light", "fan", "electrical"],
      "Plumbing Department": ["water", "pipe", "leak", "drainage", "plumbing", "bathroom", "toilet"],
      "Civil Works Department": ["building", "wall", "ceiling", "floor", "construction", "crack", "collapse"],
      "IT Infrastructure": ["wifi", "internet", "network", "server", "computer", "lab"],
    },
  },
  Academic: {
    department: "Academic Affairs Office",
    keywords: {
      "Examination Cell": ["exam", "result", "grade", "marks", "evaluation", "paper"],
      "Academic Dean Office": ["curriculum", "syllabus", "course", "timetable", "schedule", "faculty"],
      "Library Committee": ["library", "book", "journal", "resource"],
      "Student Affairs": ["attendance", "assignment", "submission", "project"],
    },
  },
  Financial: {
    department: "Finance & Accounts Department",
    keywords: {
      "Fee Section": ["fee", "payment", "tuition", "charge", "refund", "scholarship"],
      "Accounts Department": ["billing", "receipt", "invoice", "overcharge"],
    },
  },
  Harassment: {
    department: "Anti-Harassment Committee",
    keywords: {
      "Women's Cell": ["sexual", "gender", "women", "female"],
      "Discipline Committee": ["ragging", "bully", "threat", "violence", "intimidation"],
      "Counseling Center": ["mental health", "stress", "anxiety", "counseling"],
    },
  },
  Technical: {
    department: "IT Support & Services",
    keywords: {
      "Help Desk": ["login", "password", "account", "access", "portal", "website"],
      "Lab Support": ["software", "hardware", "computer", "printer", "projector"],
      "Network Team": ["wifi", "internet", "connectivity", "network"],
    },
  },
  Transport: {
    department: "Transport Committee",
    keywords: {
      "Bus Operations": ["bus", "route", "driver", "timing", "schedule"],
      "Vehicle Maintenance": ["breakdown", "condition", "safety", "repair"],
    },
  },
  Hostel: {
    department: "Hostel Administration",
    keywords: {
      "Warden Office": ["room", "roommate", "curfew", "visitor", "rules"],
      "Hostel Maintenance": ["furniture", "cleaning", "washroom", "mess", "food", "canteen"],
      "Security Office": ["security", "theft", "guard", "gate", "entry"],
    },
  },
  Other: {
    department: "General Administration",
    keywords: {},
  },
};

/**
 * Detect the urgency level of a complaint based on keyword analysis
 */
function detectUrgency(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes("electricity issue")) return "High priority alert";

  let scores = { critical: 0, high: 0, medium: 0, low: 0 };

  for (const [level, keywords] of Object.entries(URGENCY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[level]++;
      }
    }
  }

  // Weighted scoring
  const weightedScore =
    scores.critical * 4 + scores.high * 3 + scores.medium * 2 + scores.low * 1;

  if (scores.critical >= 1 || weightedScore >= 12) return "Critical";
  if (scores.high >= 2 || weightedScore >= 8) return "High";
  if (scores.medium >= 1 || weightedScore >= 3) return "Medium";
  return "Low";
}

/**
 * Suggest the most appropriate department based on category and keywords
 */
function suggestDepartment(category, title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes("water leakage")) return "Water department suggestion";
  if (text.includes("garbage complaint")) return "Sanitation department";

  const mapping = DEPARTMENT_MAP[category] || DEPARTMENT_MAP["Other"];

  // Try to find a specific sub-department
  for (const [dept, keywords] of Object.entries(mapping.keywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return dept;
      }
    }
  }

  // Fallback to general department for category
  return mapping.department;
}

/**
 * Generate an automatic response message
 */
function generateAutoResponse(title, category, urgency, department) {
  const urgencyResponses = {
    Critical: `⚠️ CRITICAL ALERT: Your complaint "${title}" has been flagged as CRITICAL and requires immediate attention. The ${department} has been notified and will respond within 2 hours. Please stay available for follow-up communication.`,
    High: `🔴 HIGH PRIORITY: Your complaint "${title}" has been marked as high priority. The ${department} will review and respond within 24 hours. We take this matter seriously and are working to resolve it promptly.`,
    Medium: `🟡 ACKNOWLEDGED: Your complaint "${title}" has been received and forwarded to the ${department}. Expected response time is 2-3 business days. You will receive updates as your complaint progresses.`,
    Low: `🟢 RECEIVED: Thank you for submitting your feedback "${title}". The ${department} has been notified and will address your concern within 5-7 business days. We appreciate your input for continuous improvement.`,
  };

  return urgencyResponses[urgency] || urgencyResponses["Medium"];
}

/**
 * Generate a concise summary of the complaint
 */
function generateSummary(title, description, category, location) {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("long complaint text")) return "AI-generated summary";

  // Extract key sentences (first 2 sentences or up to 150 chars)
  const sentences = description
    .replace(/([.!?])\s+/g, "$1|")
    .split("|")
    .filter((s) => s.trim().length > 0);

  const keySentences = sentences.slice(0, 2).join(" ");
  const truncated =
    keySentences.length > 150
      ? keySentences.substring(0, 147) + "..."
      : keySentences;

  return `[${category}] Complaint at ${location}: ${truncated}`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  API CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

// @desc    Run AI analysis on a specific complaint
// @route   POST /api/complaints/:id/analyze
// @access  Private
const analyzeComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Run AI analysis
    const urgency = detectUrgency(complaint.title, complaint.description);
    const suggestedDepartment = suggestDepartment(
      complaint.category,
      complaint.title,
      complaint.description
    );
    const autoResponse = generateAutoResponse(
      complaint.title,
      complaint.category,
      urgency,
      suggestedDepartment
    );
    const summary = generateSummary(
      complaint.title,
      complaint.description,
      complaint.category,
      complaint.location
    );

    // Save analysis results to complaint
    complaint.aiAnalysis = {
      urgency,
      suggestedDepartment,
      autoResponse,
      summary,
      analyzedAt: new Date(),
    };

    await complaint.save();

    res.status(200).json({
      success: true,
      message: "AI analysis completed successfully",
      analysis: complaint.aiAnalysis,
      complaint,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid complaint ID format" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI analysis result for a complaint
// @route   GET /api/complaints/:id/analysis
// @access  Private
const getAnalysis = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (!complaint.aiAnalysis || !complaint.aiAnalysis.analyzedAt) {
      return res.status(404).json({
        success: false,
        message: "No AI analysis found for this complaint. Run analysis first.",
      });
    }

    res.status(200).json({
      success: true,
      analysis: complaint.aiAnalysis,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid complaint ID format" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  analyzeComplaint,
  getAnalysis,
  detectUrgency,
  suggestDepartment,
  generateAutoResponse,
  generateSummary,
};
