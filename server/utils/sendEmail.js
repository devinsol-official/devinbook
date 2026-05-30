const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1) Create a transporter
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USERNAME || process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: process.env.EMAIL_FROM || `DevinBook <devinbook@devinsol.com>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  // 3) Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    // don't throw, we don't want a failed email to crash the activation process
  }
};

module.exports = sendEmail;
