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
    console.log(error)
    throw new Error('Email transporter verification failed');
  }
});



const sendResetEmail = asyncHandler(async (email) => {
  const password = generator.generate({
    length: 10,
    numbers: true
  });

  const info = await transporter.sendMail({
    from: `Mignite ${process.env.USER_EMAIL}`,
    to: email,
    subject: `Reset Your Password - Mignite`,
    text: `
Hello,

You recently requested to reset your password for your Mignite account. Please use the temporary password provided below to log in and reset your password:

Temporary Password: ${password}

Important Notes:
• This password is temporary and should be changed immediately after login.
• Keep it confidential and do not share it with anyone.
• If you did not request a password reset, please ignore this email or contact our support team.

If you need assistance, we’re here to help.

Warm Regards,  
Team Mignite
    `
  });

  return password;
});


  const sendVerificationEmail = asyncHandler(async(otp, email) => {
   
    const info = await transporter.sendMail({
      from: `Mignite ${process.env.USER_EMAIL}`,
      to: email,
      subject: `Verify Your Email Address - Mignite`, 
      text: `
Hello,

Thank you for signing up with Mignite! To complete the verification of your email address, please use the One-Time Password (OTP) provided below.

Your OTP/Verification Code is: ${otp}

Please note:
• This OTP is valid only for one-time use.
• Keep it confidential and do not share it with anyone.
• Once verified, you’ll gain full access to your account.

If you didn’t sign up for Mignite, please disregard this email or contact us immediately.

We’re here to assist if you have any questions or need help.

Warm Regards,  
Team Mignite
      `,
  });
  return true;
    
  })


  module.exports = {
    sendResetEmail,
    verifyTransporter,
    sendVerificationEmail
  }