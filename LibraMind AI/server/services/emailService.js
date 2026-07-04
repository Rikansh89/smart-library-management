const nodemailer = require('nodemailer');
const logger = require('./loggerService');

let transporter = null;

function getTransporter() {
  if (!transporter) {
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
    }
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    logger.warn('Email not configured. Skipping email send.');
    return { success: false, message: 'Email not configured' };
  }

  try {
    const info = await t.sendMail({
      from: `"LibraMind AI" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    throw error;
  }
}

async function sendDueDateReminder(user, book, dueDate) {
  return sendEmail({
    to: user.email,
    subject: 'Book Due Date Reminder - LibraMind AI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">LibraMind AI - Due Date Reminder</h2>
        <p>Dear ${user.name},</p>
        <p>This is a reminder that the book "<strong>${book.title}</strong>" is due on <strong>${new Date(dueDate).toLocaleDateString()}</strong>.</p>
        <p>Please return or renew it on time to avoid fines.</p>
        <br>
        <p>Thank you,<br>LibraMind AI Team</p>
      </div>
    `
  });
}

async function sendOverdueAlert(user, book, fine) {
  return sendEmail({
    to: user.email,
    subject: 'Overdue Book Alert - LibraMind AI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">LibraMind AI - Overdue Alert</h2>
        <p>Dear ${user.name},</p>
        <p>The book "<strong>${book.title}</strong>" is now overdue.</p>
        <p>Current fine: <strong>$${fine.toFixed(2)}</strong></p>
        <p>Please return the book immediately to avoid additional charges.</p>
        <br>
        <p>Thank you,<br>LibraMind AI Team</p>
      </div>
    `
  });
}

async function sendReservationNotification(user, book) {
  return sendEmail({
    to: user.email,
    subject: 'Book Reservation Available - LibraMind AI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">LibraMind AI - Reservation Available</h2>
        <p>Dear ${user.name},</p>
        <p>The book "<strong>${book.title}</strong>" you reserved is now available.</p>
        <p>Please collect it from the library within the next 48 hours.</p>
        <br>
        <p>Thank you,<br>LibraMind AI Team</p>
      </div>
    `
  });
}

module.exports = { sendEmail, sendDueDateReminder, sendOverdueAlert, sendReservationNotification };
