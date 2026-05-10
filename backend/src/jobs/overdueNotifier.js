const cron = require("node-cron");
const pool = require("../db");
const { sendEmail } = require("../services/emailService");

async function notifyOverdues() {
  try {
    console.log("🧐 Checking for due and overdue books...");

    const { rows } = await pool.query(`
      SELECT br.id, u.name, u.email, b.title AS book_title, br.expected_return_date
      FROM borrows br
      JOIN users u ON br.user_id = u.id
      JOIN books b ON br.book_id = b.id
      WHERE br.status = 'approved'
        AND br.actual_return_date IS NULL
        AND br.expected_return_date <= CURRENT_DATE;
    `);

    if (!rows.length) {
      console.log("✅ No due or overdue loans found.");
      return { total: 0, sent: 0, failed: 0, usingTestTransport: !process.env.EMAIL_HOST };
    }

    if (!process.env.EMAIL_HOST) {
      console.warn("⚠️ SMTP is not configured. Email notifications will only be generated via Ethereal preview and will not reach real inboxes.");
    }

    let sentCount = 0;
    let failedCount = 0;

    await Promise.all(rows.map(async (row) => {
      const dueDate = new Date(row.expected_return_date).toDateString();
      const subject = `Return due today: ${row.book_title}`;
      const text = `Hello ${row.name},\n\nYour borrowed book \"${row.book_title}\" is due today (${dueDate}). Please return it as soon as possible.\n\nThank you,\nYour Library Team`;
      const html = `
        <p>Hello ${row.name},</p>
        <p>Your borrowed book <strong>"${row.book_title}"</strong> is due today (<strong>${dueDate}</strong>).</p>
        <p>Please return it as soon as possible.</p>
        <p>Thank you,<br/>Your Library Team</p>
      `;

      if (row.email) {
        try {
          await sendEmail({
            to: row.email,
            subject,
            text,
            html,
          });
          sentCount += 1;
          console.log(`📨 Due-date email sent to ${row.email}`);
        } catch (emailError) {
          failedCount += 1;
          console.error(`❌ Failed to send due-date email to ${row.email}:`, emailError.message);
        }
      } else {
        failedCount += 1;
        console.log(`📢 ${row.name} has a due book but no email address configured.`);
      }
    }));

    return { total: rows.length, sent: sentCount, failed: failedCount, usingTestTransport: !process.env.EMAIL_HOST };
  } catch (err) {
    console.error(err.message);
    throw err;
  }
}

function startOverdueCron() {
  cron.schedule("0 9 * * *", notifyOverdues);
  console.log("⏰ Cron Job Initialized");
}

module.exports = { startOverdueCron, notifyOverdues }; // <--- MUST HAVE THIS LINE