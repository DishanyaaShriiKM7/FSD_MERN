const express = require("express");
const pool = require("../db");

const router = express.Router();

// Middleware to verify admin access
function requireAdmin(req, res, next) {
  const role = req.header("x-user-role");
  if (role !== "admin") {
    return res.status(403).json({ error: "Admin role required." });
  }
  return next();
}

// 1. GET MY BOOKS
router.get("/my-books", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "User ID required." });

  try {
    const { rows } = await pool.query(
      `
      SELECT b.*, br.borrowed_at, br.approved_at, br.expected_return_date, br.actual_return_date, br.status, br.id as borrow_id,
             GREATEST(EXTRACT(DAY FROM CURRENT_DATE - br.expected_return_date), 0)::int * 10 AS fine
      FROM books b
      JOIN borrows br ON b.id = br.book_id
      WHERE br.user_id = $1 AND br.status IN ('pending', 'approved')
      ORDER BY br.borrowed_at DESC;
      `,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1. GET ALL BOOKS
// Includes 'genre' and 'created_at' for proper frontend display
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT id, title, author, cover_image_url, total_copies, available_copies, genre, created_at
      FROM books
      ORDER BY created_at DESC, id DESC;
      `
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. CREATE BOOK
router.post("/", requireAdmin, async (req, res) => {
  const { title, author, cover_image_url, total_copies, genre } = req.body;

  if (!title || !author || !total_copies) {
    return res.status(400).json({ error: "Title, author, and total copies are required." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO books (title, author, cover_image_url, total_copies, available_copies, genre)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [
        title, 
        author, 
        cover_image_url || null, 
        Number(total_copies), 
        Number(total_copies), 
        genre || 'General'
      ]
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 3. UPDATE BOOK
router.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, author, cover_image_url, total_copies, available_copies, genre } = req.body;

  if (!title || !author || total_copies === undefined) {
    return res.status(400).json({ error: "Title, author, and total_copies are required." });
  }

  try {
    const { rows } = await pool.query(
      `
      UPDATE books
      SET title = $1, author = $2, cover_image_url = $3, total_copies = $4, available_copies = $5, genre = $6
      WHERE id = $7
      RETURNING *;
      `,
      [
        title, 
        author, 
        cover_image_url || null, 
        Number(total_copies), 
        Number(available_copies), 
        genre || 'General', 
        id
      ]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Book not found." });
    }
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 4. DELETE BOOK
router.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query("DELETE FROM books WHERE id = $1;", [id]);
    if (!rowCount) {
      return res.status(404).json({ error: "Book not found." });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 5. BORROW BOOK (Sets as 'pending')
router.post("/:id/borrow", async (req, res) => {
  const bookId = req.params.id;
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "User ID required." });

  try {
    // Check if a pending or approved request already exists
    const { rows: existing } = await pool.query(
      "SELECT id FROM borrows WHERE user_id = $1 AND book_id = $2 AND status IN ('pending', 'approved');",
      [userId, bookId]
    );
    if (existing.length) {
      return res.status(400).json({ error: "You already have a pending or approved request for this book." });
    }

    await pool.query(
      "INSERT INTO borrows (user_id, book_id, status) VALUES ($1, $2, 'pending');",
      [userId, bookId]
    );
    
    return res.status(200).json({ success: true, status: 'pending' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 6. RETURN BOOK
router.post("/:id/return", async (req, res) => {
  const bookId = req.params.id;
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "User ID required." });

  try {
    await pool.query("BEGIN");

    const { rows } = await pool.query(
      `UPDATE borrows
       SET status = 'returned', actual_return_date = NOW()
       WHERE user_id = $1 AND book_id = $2 AND status = 'approved' AND actual_return_date IS NULL
       RETURNING id;`,
      [userId, bookId]
    );

    if (!rows.length) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ error: "No active approved borrow found to return." });
    }

    await pool.query("UPDATE books SET available_copies = available_copies + 1 WHERE id = $1;", [bookId]);
    await pool.query("COMMIT");
    return res.status(200).json({ success: true });
  } catch (error) {
    await pool.query("ROLLBACK");
    return res.status(500).json({ error: error.message });
  }
});

// 7. APPROVE BORROW REQUEST
router.post("/borrows/:borrowId/approve", requireAdmin, async (req, res) => {
  const { borrowId } = req.params;
  const { dueDate } = req.body;

  try {
    await pool.query("BEGIN");
    
    // Check pending state and get book info
    const { rows: br } = await pool.query("SELECT book_id, status FROM borrows WHERE id = $1 FOR UPDATE;", [borrowId]);
    if (!br.length || br[0].status !== 'pending') {
      await pool.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid borrow request or already processed." });
    }

    const bookId = br[0].book_id;
    const { rows: books } = await pool.query("SELECT available_copies FROM books WHERE id = $1 FOR UPDATE;", [bookId]);
    if (!books.length || books[0].available_copies <= 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ error: "Book is out of stock." });
    }

    const dueValue = dueDate && !Number.isNaN(new Date(dueDate).getTime())
      ? new Date(dueDate)
      : null;

    const expectedReturnClause = dueValue
      ? `expected_return_date = $2`
      : `expected_return_date = CURRENT_DATE + INTERVAL '14 days'`;

    const params = dueValue ? [borrowId, dueDate] : [borrowId];

    await pool.query("UPDATE books SET available_copies = available_copies - 1 WHERE id = $1;", [bookId]);
    await pool.query(
      `UPDATE borrows SET status = 'approved', approved_at = NOW(), ${expectedReturnClause} WHERE id = $1;`,
      params
    );
    
    await pool.query("COMMIT");
    return res.status(200).json({ success: true });
  } catch (error) {
    await pool.query("ROLLBACK");
    return res.status(500).json({ error: error.message });
  }
});

// 8. REJECT BORROW REQUEST
router.post("/borrows/:borrowId/reject", requireAdmin, async (req, res) => {
  const { borrowId } = req.params;
  try {
    const { rowCount } = await pool.query("UPDATE borrows SET status = 'rejected' WHERE id = $1 AND status = 'pending';", [borrowId]);
    if (!rowCount) return res.status(400).json({ error: "Invalid borrow request." });
    
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;