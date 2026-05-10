const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./db");
const overdueRouter = require("./routes/overdue");
const booksRouter = require("./routes/books");
const authRouter = require("./routes/auth");
const statsRouter = require("./routes/stats");
const usersRouter = require("./routes/users");
const { startOverdueCron } = require("./jobs/overdueNotifier");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/overdue", overdueRouter);
app.use("/api/books", booksRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/stats", statsRouter);

async function bootstrapDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(150),
      password VARCHAR(255) NOT NULL DEFAULT 'password123',
      phone VARCHAR(20) NOT NULL DEFAULT '+10000000000',
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'phone_number'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'phone'
      ) THEN
        ALTER TABLE users RENAME COLUMN phone_number TO phone;
      END IF;
    END$$;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email VARCHAR(150);
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password VARCHAR(255) NOT NULL DEFAULT 'password123';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS name TEXT;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
  `);

  await pool.query(`
    UPDATE users
    SET phone = '+10000000000'
    WHERE phone IS NULL;
  `);

  await pool.query(`
    ALTER TABLE users
    ALTER COLUMN phone SET DEFAULT '+10000000000';
  `);

  await pool.query(`
    ALTER TABLE users
    ALTER COLUMN phone SET NOT NULL;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_email_unique'
      ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
      END IF;
    EXCEPTION
      WHEN duplicate_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END$$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(180) NOT NULL,
      cover_image_url TEXT,
      total_copies INT NOT NULL CHECK (total_copies >= 0),
      available_copies INT NOT NULL DEFAULT 0 CHECK (available_copies >= 0),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE books
    ADD COLUMN IF NOT EXISTS genre VARCHAR(100) DEFAULT 'General';
  `);

  await pool.query(`
    INSERT INTO users (name, email, password, phone, role)
    SELECT 'Admin User', 'admin@library.local', 'admin123', '+10000000001', 'admin'
    WHERE NOT EXISTS (
      SELECT 1 FROM users WHERE email = 'admin@library.local'
    );
  `);

  await pool.query(`
    INSERT INTO users (name, email, password, phone, role)
    SELECT 'Library User', 'user@library.local', 'user123', '+10000000002', 'user'
    WHERE NOT EXISTS (
      SELECT 1 FROM users WHERE email = 'user@library.local'
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS borrows (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      book_id INT REFERENCES books(id) ON DELETE CASCADE,
      borrowed_at TIMESTAMP DEFAULT NOW(),
      approved_at TIMESTAMP,
      expected_return_date TIMESTAMP,
      actual_return_date TIMESTAMP,
      status VARCHAR(20) DEFAULT 'pending'
    );
  `);

  await pool.query(`
    ALTER TABLE borrows
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
  `);

  await pool.query(`
    ALTER TABLE borrows
    ADD COLUMN IF NOT EXISTS expected_return_date TIMESTAMP;
  `);

  await pool.query(`
    ALTER TABLE borrows
    ADD COLUMN IF NOT EXISTS actual_return_date TIMESTAMP;
  `);

  await pool.query(`
    ALTER TABLE borrows 
    ALTER COLUMN status SET DEFAULT 'pending';
  `);
}

const PORT = process.env.PORT || 5000;
bootstrapDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      startOverdueCron();
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database schema:", error.message);
    process.exit(1);
  });