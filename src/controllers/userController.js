const { validationResult } = require("express-validator");
const User = require("../models/User");
 
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-__v");
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
exports.updateRole = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
 
  try {
    // Admin cannot downgrade their own role accidentally
    if (req.params.id === req.user._id.toString() && req.body.role !== "admin") {
      return res
        .status(400)
        .json({ message: "You cannot change your own role" });
    }
 
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, runValidators: true }
    ).select("-__v");
 
    if (!user) return res.status(404).json({ message: "User not found" });
 
    res.json({ message: "Role updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
exports.updateStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
 
  try {
    if (req.params.id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot deactivate your own account" });
    }
 
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    ).select("-__v");
 
    if (!user) return res.status(404).json({ message: "User not found" });
 
    res.json({
      message: `User ${req.body.isActive ? "activated" : "deactivated"}`,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};