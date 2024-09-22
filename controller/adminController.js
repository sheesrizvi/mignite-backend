const asyncHandler = require("express-async-handler");
const { generateTokenAdmin } = require("../utils/generateToken.js");
const Admin = require("../models/adminModel.js");

// @desc    Auth user & get token
// @route   POST /api/users/login
//  @access   Public

const authAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
 
  if (admin && (await admin.matchPassword(password))) {
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      token: generateTokenAdmin(admin._id, admin.name, admin.email, admin.type),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    User registration
// @route   POST /api/users
//@access   Public

const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await Admin.findOne({ email });

  if (userExists) {
    res.status(404);
    throw new Error("User already exists");
  }

  const admin = await Admin.create({
    name,
    email,
    password,
  });

  if (admin) {
    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      token: generateTokenAdmin(admin._id, admin.name, admin.email, admin.type),
    });
  } else {
    res.status(404);
    throw new Error("Invalid user data");
  }
});


module.exports = {
  authAdmin,
  registerAdmin,
};
