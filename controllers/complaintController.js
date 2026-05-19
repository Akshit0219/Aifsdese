const Complaint = require("../models/Complaint");

// @desc    Submit a new complaint
// @route   POST /api/complaints
// @access  Private
const submitComplaint = async (req, res) => {
  try {
    const { name, email, title, description, category, location } = req.body;

    const complaint = await Complaint.create({
      name,
      email,
      title,
      description,
      category,
      location,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all complaints (with optional category & location filters)
// @route   GET /api/complaints?category=xxx&location=xxx&status=xxx
// @access  Private
const getAllComplaints = async (req, res) => {
  try {
    const { category, location, status } = req.query;
    const filter = {};

    if (category && category !== "all") filter.category = category;
    if (status && status !== "all") filter.status = status;
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    const complaints = await Complaint.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search complaints by location or general query
// @route   GET /api/complaints/search?location=Ghaziabad or ?q=xyz
// @access  Private
const searchComplaints = async (req, res) => {
  try {
    const { q, location } = req.query;

    if (!q && !location) {
      return res.status(400).json({
        success: false,
        message: "Please provide a search query or location",
      });
    }

    let filter = {};
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    } else if (q) {
      filter = {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { location: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
        ],
      };
    }

    const complaints = await Complaint.find(filter).populate("user", "name email role");

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate(
      "user",
      "name email role"
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    res.status(200).json({ success: true, complaint });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid complaint ID format" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private
const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (status) complaint.status = status;

    const updated = await complaint.save();

    res.status(200).json({
      success: true,
      message: "Complaint status updated successfully",
      complaint: updated,
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

// @desc    Update a complaint by ID
// @route   PUT /api/complaints/:id
// @access  Private
const updateComplaint = async (req, res) => {
  try {
    const { name, email, title, description, category, location, status } =
      req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (name) complaint.name = name;
    if (email) complaint.email = email;
    if (title) complaint.title = title;
    if (description) complaint.description = description;
    if (category) complaint.category = category;
    if (location) complaint.location = location;
    if (status) complaint.status = status;

    const updated = await complaint.save();

    res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      complaint: updated,
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

// @desc    Delete a complaint by ID
// @route   DELETE /api/complaints/:id
// @access  Private
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Complaint deleted successfully",
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
  submitComplaint,
  getAllComplaints,
  searchComplaints,
  getComplaintById,
  updateComplaintStatus,
  updateComplaint,
  deleteComplaint,
};
