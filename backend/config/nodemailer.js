const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Email transporter configured.');
} else {
  console.log('Email not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS to enable.');
}

const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.warn('Email not configured. Skipping send to:', to);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Smart Library" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Email sending failed:', error.message);
  }
};

module.exports = { sendEmail };
