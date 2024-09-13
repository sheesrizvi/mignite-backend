const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");
const asyncHandler = require("express-async-handler");

const Instructor = require("../models/instructorModel");
const User = require("../models/userModel");

const auth = asyncHandler(async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.status(403).send("Access denied. Login Required");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await Admin.findById(decoded.id);
    if(!req.user) {
      return res.status(400).send({status: false, message: 'Not Authorized'})
    }
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
    if(!req.user) {
      return res.status(400).send({status: false, message: 'Admin not Found'})
    }
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
    if(!req.user) {
      return res.status(400).send({status: false, message: 'Instructor not authorized'})
    }
    next();
  } catch (error) {
    res.status(400).send("Invalid token");
  }
});

const isUser = asyncHandler(async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.status(403).send("Access denied. Login Required");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);
    if(!req.user) {
      return res.status(400).send({status: false, message: 'User not authorized'})
    }
    next();
  } catch (error) {
    res.status(400).send("Invalid token");
  }
});

const isAdminorInstructor = async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.status(403).send("Access denied. Login Required");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded.type)
    if(decoded.type === 'admin') {
      
      req.user = await Admin.findById(decoded.id);
    } 
    if(decoded.type === 'instructor') {
      req.user = await Instructor.findById(decoded.id);
    }
    
    if(!req.user) {
      return res.status(400).send({status: false, message: 'Not authorized'})
    }
    next();
  } catch (error) {
    res.status(400).send("Invalid token");
  }
}

module.exports = {
  admin,
  auth,
  instructor,
  isUser,
  isAdminorInstructor
};
