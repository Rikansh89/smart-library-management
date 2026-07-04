const dueDateReminder = (userName, bookTitle, dueDate) => ({
  subject: 'Due Date Reminder - Smart Library',
  html: `<h2>Hello ${userName}</h2>
<p>This is a reminder that "<strong>${bookTitle}</strong>" is due on <strong>${new Date(dueDate).toLocaleDateString()}</strong>.</p>
<p>Please return it on time to avoid fines.</p>
<p>Thank you,<br>Smart Library Team</p>`
});

const reservationAvailable = (userName, bookTitle) => ({
  subject: 'Book Available - Smart Library',
  html: `<h2>Hello ${userName}</h2>
<p>Good news! "<strong>${bookTitle}</strong>" is now available for you.</p>
<p>Please visit the library to borrow it within 48 hours.</p>
<p>Thank you,<br>Smart Library Team</p>`
});

const passwordReset = (userName, resetUrl) => ({
  subject: 'Password Reset - Smart Library',
  html: `<h2>Hello ${userName}</h2>
<p>Click the link below to reset your password:</p>
<a href="${resetUrl}" style="padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">Reset Password</a>
<p>This link expires in 1 hour.</p>
<p>Thank you,<br>Smart Library Team</p>`
});

module.exports = { dueDateReminder, reservationAvailable, passwordReset };
