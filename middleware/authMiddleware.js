const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");
const asyncHandler = require("express-async-handler");

const Instructor = require("../models/instructorModel");

const auth = asyncHandler(async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.status(403).send("Access denied. Login Required");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await Admin.findById(decoded.id);
    next();
  } catch (error) {
    res.status(400).send("Invalid token");
  }
});

const admin = asyncHandler(async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token)
      return res.status(403).send("Access denied. Admin Login Required");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await Admin.findById(decoded.id);
    next();
  } catch (error) {
    res.status(400).send("Invalid token");
  }
});

const instructor = asyncHandler(async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.status(403).send("Access denied. Login Required");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await Instructor.findById(decoded.id);
    next();
  } catch (error) {
    res.status(400).send("Invalid token");
  }
});



module.exports = {
  admin,
  auth,
  instructor
};
