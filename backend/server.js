require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

// API Endpoints

// Get all seats
app.get('/api/seats', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM seats ORDER BY row_number, seat_number');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Book seats
app.post('/api/seats/book', async (req, res) => {
  const { count } = req.body;
  
  try {
    // Special case for 3 seats (prioritize row 7)
    if (count === 3) {
      const result = await pool.query(`
        WITH available AS (
          SELECT id FROM seats 
          WHERE row_number = 7 AND is_booked = FALSE
          ORDER BY seat_number
        )
        UPDATE seats
        SET is_booked = TRUE
        WHERE id IN (SELECT id FROM available LIMIT 3)
        RETURNING *;
      `);
      
      if (result.rowCount === 3) {
        return res.json(result.rows);
      }
    }

    // Normal case - try to find contiguous seats
    const contiguousResult = await pool.query(`
      WITH ranked_seats AS (
        SELECT 
          id,
          row_number,
          seat_number,
          is_booked,
          seat_number - ROW_NUMBER() OVER (PARTITION BY row_number ORDER BY seat_number) AS grp
        FROM seats
        WHERE is_booked = FALSE
      ),
      groups AS (
        SELECT 
          row_number,
          grp,
          COUNT(*) AS cnt,
          ARRAY_AGG(id) AS seat_ids
        FROM ranked_seats
        GROUP BY row_number, grp
      )
      SELECT seat_ids
      FROM groups
      WHERE cnt >= $1
      ORDER BY row_number, grp
      LIMIT 1;
    `, [count]);

    if (contiguousResult.rows.length > 0) {
      const updateResult = await pool.query(`
        UPDATE seats
        SET is_booked = TRUE
        WHERE id = ANY($1::int[])
        RETURNING *;
      `, [contiguousResult.rows[0].seat_ids.slice(0, count)]);
      
      return res.json(updateResult.rows);
    }

    // Fallback - book individual seats if no contiguous block found
    if (count === 1) {
      const individualResult = await pool.query(`
        UPDATE seats
        SET is_booked = TRUE
        WHERE id IN (
          SELECT id FROM seats 
          WHERE is_booked = FALSE
          ORDER BY row_number, seat_number
          LIMIT 1
        )
        RETURNING *;
      `);
      
      if (individualResult.rowCount === 1) {
        return res.json(individualResult.rows);
      }
    }

    res.status(400).json({ error: 'No suitable seats available' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset all seats
app.post('/api/seats/reset', async (req, res) => {
  try {
    await pool.query('UPDATE seats SET is_booked = FALSE');
    const result = await pool.query('SELECT * FROM seats ORDER BY row_number, seat_number');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
