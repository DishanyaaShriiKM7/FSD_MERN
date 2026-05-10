const express = require("express");
const pool = require("../db");

const router = express.Router();

function requireAdmin(req, res, next) {
  const role = req.header("x-user-role");
  if (role !== "admin") {
    return res.status(403).json({ error: "Admin role required." });
  }
  return next();
}

// GET /api/users - List all members with borrowing stats
router.get("/", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.created_at,
        COUNT(CASE WHEN b.actual_return_date IS NULL THEN 1 END) as active_borrows,
        COUNT(CASE WHEN b.expected_return_date < NOW() AND b.actual_return_date IS NULL THEN 1 END) as overdue_count,
        COALESCE(SUM(CASE WHEN b.expected_return_date < NOW() AND b.actual_return_date IS NULL THEN GREATEST(0, EXTRACT(DAY FROM (NOW() - b.expected_return_date))::INT) * 10 ELSE 0 END), 0) as total_fine
      FROM users u
      LEFT JOIN borrows b ON u.id = b.user_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.name, u.email, u.phone, u.role, u.created_at
      ORDER BY u.created_at DESC
    `);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Get member details with stats
router.get("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const memberResult = await pool.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1 AND role = 'user'",
      [id]
    );
    if (!memberResult.rows.length) {
      return res.status(404).json({ error: "Member not found." });
    }
    const member = memberResult.rows[0];

    const statsResult = await pool.query(`
      SELECT
        COUNT(CASE WHEN b.actual_return_date IS NULL THEN 1 END) as active_borrows,
        COUNT(*) as total_borrows,
        COUNT(CASE WHEN b.expected_return_date < NOW() AND b.actual_return_date IS NULL THEN 1 END) as overdue_count,
        COALESCE(SUM(CASE WHEN b.expected_return_date < NOW() AND b.actual_return_date IS NULL THEN GREATEST(0, EXTRACT(DAY FROM (NOW() - b.expected_return_date))::INT) * 10 ELSE 0 END), 0) as total_fine
      FROM borrows b
      WHERE b.user_id = $1
    `, [id]);
    
    const stats = statsResult.rows[0];
    return res.json({ ...member, ...stats });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id/history - Get member borrowing history
router.get("/:id/history", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT
        b.id,
        b.book_id,
        bk.title,
        bk.author,
        b.borrowed_at,
        b.expected_return_date,
        b.actual_return_date,
        CASE 
          WHEN b.actual_return_date IS NULL AND b.expected_return_date < NOW() 
          THEN GREATEST(0, EXTRACT(DAY FROM (NOW() - b.expected_return_date))::INT) * 10
          WHEN b.actual_return_date IS NOT NULL AND b.actual_return_date > b.expected_return_date
          THEN GREATEST(0, EXTRACT(DAY FROM (b.actual_return_date - b.expected_return_date))::INT) * 10
          ELSE 0
        END as fine
      FROM borrows b
      JOIN books bk ON b.book_id = bk.id
      WHERE b.user_id = $1
      ORDER BY b.borrowed_at DESC
    `, [id]);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Update member details
router.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Name, email, and phone are required." });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET name = $1, email = $2, phone = $3 
       WHERE id = $4 AND role = 'user'
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone, id]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Member not found." });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already in use." });
    }
    return res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1;", [id]);
    if (!rowCount) {
      return res.status(404).json({ error: "Member not found." });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
