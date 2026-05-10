const express = require("express");
const { notifyOverdues } = require("../jobs/overdueNotifier");
const pool = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT br.id, u.name AS user_name, u.email, u.phone, b.title AS book_title, br.borrowed_at, br.approved_at, br.expected_return_date,
             GREATEST(EXTRACT(DAY FROM CURRENT_DATE - br.expected_return_date), 0)::int * 10 AS fine
      FROM borrows br
      JOIN users u ON br.user_id = u.id
      JOIN books b ON br.book_id = b.id
      WHERE br.status = 'approved'
        AND br.actual_return_date IS NULL;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/notify", async (req, res) => {
  try {
    const summary = await notifyOverdues();
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; // <--- MUST HAVE THIS LINE