const ComplaintTest = require("../models/ComplaintTest");

// @desc    Submit a new complaint
// @route   POST /api/complaints
const submitComplaint = async (req, res) => {
  try {
    const { name, email, title, description, category, location } = req.body;

    const complaint = await ComplaintTest.create({
      name,
      email,
      title,
      description,
      category,
      location,
      user: req.user ? req.user._id : null,
    });

    res.status(201).json({
      message: "Complaint stored successfully",
      complaint,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ error: messages[0] });
    }
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Get all complaints
// @route   GET /api/complaints
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await ComplaintTest.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email role");

    res.status(200).json({
      complaints,
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Get single complaint by ID
// @route   GET /api/complaints/:id
const getComplaintById = async (req, res) => {
  try {
    const complaint = await ComplaintTest.findById(req.params.id).populate("user", "name email role");
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    res.status(200).json({ complaint });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id
const updateComplaint = async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await ComplaintTest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.status(200).json({
      message: "Complaint updated successfully",
      complaint,
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Search complaint by location or general query
// @route   GET /api/complaints/search?location=Ghaziabad  OR  ?q=Water
const searchComplaints = async (req, res) => {
  try {
    const { location, q } = req.query;

    if (!location && !q) {
      return res.status(400).json({ error: "Please provide a location or search query" });
    }

    let filter = {};
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    } else {
      filter = {
        $or: [
          { title:       { $regex: q, $options: "i" } },
          { location:    { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
        ],
      };
    }

    const complaints = await ComplaintTest.find(filter);

    res.status(200).json({
      message: "Matching complaints displayed",
      complaints,
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await ComplaintTest.findByIdAndDelete(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.status(200).json({
      message: "Complaint removed",
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = {
  submitComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  searchComplaints,
  deleteComplaint,
};
