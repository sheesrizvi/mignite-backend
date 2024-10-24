const express = require("express");
const router = express.Router();
const User = require("../models/userModel");


router.post("/register-token", async (req, res) => {
  const user = await User.findById(req.body.user._id);
  if(!user) return res.status(400).send({ message: 'User not found'})
 
    user.pushToken = req.body.token;

    const updatedUser = await user.save();
    res.status(201).send();
  
});

module.exports = router;
