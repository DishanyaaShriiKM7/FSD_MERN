const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  const role = req.header("x-user-role");

  try {
    if (role === "admin") {
      const [
        { rows: sumRows },
        { rows: outOfStockRows },
        { rows: dueTodayRows },
        { rows: membersRows },
        { rows: genreRows },
        { rows: recentRows },
        { rows: pendingRows },
        { rows: memberBorrowingsRows }
      ] = await Promise.all([
        pool.query("SELECT COALESCE(SUM(total_copies), 0)::int AS total_books, COALESCE(SUM(available_copies), 0)::int AS available_books FROM books;"),
        pool.query("SELECT COUNT(*)::int AS out_of_stock FROM books WHERE available_copies = 0;"),
        pool.query("SELECT COUNT(*)::int AS due_today FROM borrows WHERE status = 'approved' AND actual_return_date IS NULL AND expected_return_date = CURRENT_DATE;"),
        pool.query("SELECT COUNT(id)::int AS total_members FROM users WHERE role = 'user';"),
        pool.query("SELECT COALESCE(genre, 'General') AS genre, COUNT(*)::int AS count FROM books GROUP BY COALESCE(genre, 'General') ORDER BY count DESC;"),
        pool.query("SELECT id, title, author, genre, total_copies, available_copies, cover_image_url, created_at FROM books ORDER BY created_at DESC, id DESC LIMIT 3;"),
        pool.query(`
          SELECT br.id as borrow_id, br.borrowed_at, br.status, b.title as book_title, u.name as user_name
          FROM borrows br
          JOIN books b ON br.book_id = b.id
          JOIN users u ON br.user_id = u.id
          WHERE br.status = 'pending'
          ORDER BY br.borrowed_at ASC;
        `),
        pool.query(`
          SELECT u.id AS user_id,
                 u.name AS user_name,
                 u.email,
                 u.phone,
                 COALESCE(json_agg(json_build_object(
                   'borrow_id', br.id,
                   'book_title', b.title,
                   'borrowed_at', br.borrowed_at,
                   'approved_at', br.approved_at,
                   'expected_return_date', br.expected_return_date,
                   'fine', GREATEST(EXTRACT(DAY FROM CURRENT_DATE - br.expected_return_date), 0)::int * 10
                 )) FILTER (WHERE br.id IS NOT NULL), '[]') AS borrowed_books
          FROM users u
          LEFT JOIN borrows br ON br.user_id = u.id AND br.status = 'approved' AND br.actual_return_date IS NULL
          LEFT JOIN books b ON b.id = br.book_id
          WHERE u.role = 'user'
          GROUP BY u.id
          ORDER BY u.name ASC;
        `)
      ]);

      return res.json({
        totalBooks: sumRows[0]?.total_books || 0,
        availableBooks: sumRows[0]?.available_books || 0,
        outOfStockCount: outOfStockRows[0]?.out_of_stock || 0,
        dueToday: dueTodayRows[0]?.due_today || 0,
        totalMembers: membersRows[0]?.total_members || 0,
        genreBreakdown: genreRows,
        recentActivity: recentRows,
        pendingRequests: pendingRows,
        memberBorrowings: memberBorrowingsRows
      });
    } else {
      // User Role (or default)
      const [
        { rows: newArrivalsRows },
        { rows: recommendedRows }
      ] = await Promise.all([
        pool.query("SELECT id, title, author, genre, total_copies, available_copies, cover_image_url, created_at FROM books ORDER BY created_at DESC, id DESC LIMIT 3;"),
        pool.query("SELECT id, title, author, genre, total_copies, available_copies, cover_image_url, created_at FROM books ORDER BY RANDOM() LIMIT 3;")
      ]);

      return res.json({
        borrowedBooks: 0,
        dueSoon: 0,
        newArrivalsCount: newArrivalsRows.length,
        newArrivals: newArrivalsRows,
        recommended: recommendedRows
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
