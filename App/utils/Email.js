const nodemailer = require('nodemailer');
require('dotenv').config();

const send = nodemailer.createTransport({
    host: "smtp.gmail.com", 
    port: 587, 
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    },
});

const sendemail = async (email, resetCode) => {
  const credentials = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Password Reset Code',
    text: `Your password reset code is: ${resetCode}`,
  };

  try {
    await send.sendMail(credentials);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send reset password email');
  }
};




module.exports = { sendemail };