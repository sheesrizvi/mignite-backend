const nodemailer = require('nodemailer')
const asyncHandler =require('express-async-handler')
const generator = require('generate-password')
const dotenv = require('dotenv')



const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465, 
  secure: true, 

  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
});



const verifyTransporter = asyncHandler(async (req, res, next) => {
  try {
    await transporter.verify();
    next();  
  } catch (error) {
    throw new Error('Email transporter verification failed');
  }
});



const sendResetEmail = asyncHandler(async() => {
    let password = generator.generate({
      length: 10,
      numbers: true
    })
    const info = await transporter.sendMail({
      from: process.env.USER_EMAIL, 
      to: process.env.USER_EMAIL, 
      subject: `Your OTP - PASSWORD`, 
      text: `Your OTP/Temporary Password for Login is ${password}`, 
      html: `<h1>OTP/Password is ${password}</h1>`, 
    });
    return password
    
  })



  module.exports = {
    sendResetEmail,
    verifyTransporter
  }