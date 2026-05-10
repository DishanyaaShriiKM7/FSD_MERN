const nodemailer = require("nodemailer");

let transporter;

async function createTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
    const port = parseInt(process.env.EMAIL_PORT, 10);
    const secure = process.env.EMAIL_SECURE === "true";
    const auth = process.env.EMAIL_USER && process.env.EMAIL_PASS
      ? {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        }
      : undefined;

    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure,
      auth,
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("📧 No SMTP config detected. Using Ethereal test account.");
    console.log("    Emails will not be delivered to real inboxes until SMTP is configured.");
  }

  try {
    await transporter.verify();
    console.log("✅ Email transporter verified successfully.");
  } catch (verifyError) {
    console.warn("⚠️ Email transporter verification failed:", verifyError.message);
  }

  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  if (!to) {
    throw new Error("Missing recipient email address.");
  }

  const transport = await createTransporter();
  const fromValue = process.env.EMAIL_FROM
    ? process.env.EMAIL_FROM.replace(/^"(.*)"$/, "$1")
    : process.env.EMAIL_USER
    ? `Library <${process.env.EMAIL_USER}>`
    : "Library <no-reply@library.local>";

  try {
    const info = await transport.sendMail({
      from: fromValue,
      to,
      subject,
      text,
      html,
    });

    if (!process.env.EMAIL_HOST) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("📨 Email preview URL:", previewUrl);
      }
    }

    console.log("✅ Email send succeeded:", { to, subject, messageId: info.messageId });
    return info;
  } catch (error) {
    console.error("❌ Email send failed:", {
      to,
      subject,
      from: fromValue,
      error: error.message,
      code: error.code,
      response: error.response,
    });
    throw error;
  }
}

module.exports = { sendEmail };