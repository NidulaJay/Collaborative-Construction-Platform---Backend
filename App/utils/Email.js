const fs = require("fs");
const nodemailer = require("nodemailer");
const path = require("path");

require('dotenv').config();

async function sendemail(to, subject, title, otp, description) {
  try{
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  
    // Load the template
    let htmlTemplate = fs.readFileSync(path.join(__dirname, '../templates/Email.html'), 'utf8');
  
    // Replace placeholders
    htmlTemplate = htmlTemplate
      .replace("{{EMAIL_TITLE}}", title)
      .replace("{{EMAIL_OTP}}", otp)
      .replace("{{EMAIL_DESCRIPTION}}", description);
  
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: htmlTemplate,
      attachments: [
        {
          filename: 'logo.png', // this is the name shown in email
          path: path.join(__dirname, '../assets/images/Logo.png'), // adjust to your actual image path
          cid: 'logo' // this must match the cid used in your HTML template
        }
      ]
    };

    try{
      const info = await transporter.sendMail(mailOptions);
      console.log(info.response)
    } catch (err){
      console.log(err)
    }


  } catch (err) {
    console.log(err)
  }
  
}

module.exports = { sendemail };