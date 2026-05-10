const express = require("express");
const pool = require("../db");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required." });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT id, name, email, role, password
      FROM users
      WHERE email = $1
      LIMIT 1;
      `,
      [email],
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const user = rows[0];
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required." });
  }

  try {
    const { rows: existingRows } = await pool.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1;`,
      [email]
    );

    if (existingRows.length) {
      return res.status(409).json({ error: "User already exists with this email." });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, 'user')
      RETURNING id, name, email, role;
      `,
      [name, email, password]
    );

    const user = rows[0];
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;

