-- Create database (skip if already exists)
CREATE DATABASE seat_booking;

-- Connect to the database
\c seat_booking

-- Create seats table
CREATE TABLE seats (
  id SERIAL PRIMARY KEY,
  row_number INTEGER NOT NULL,
  seat_number INTEGER NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  UNIQUE(row_number, seat_number)  -- Prevent duplicate seats
);

-- Insert 45 seats (6 rows × 7 seats + 1 row × 3 seats)
INSERT INTO seats (row_number, seat_number)
VALUES
  -- Rows 1-6 (7 seats each)
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
  (2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7),
  (3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7),
  (4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7),
  (5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6), (5, 7),
  (6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6), (6, 7),
  -- Row 7 (3 seats)
  (7, 1), (7, 2), (7, 3);

-- Verify
SELECT COUNT(*) AS total_seats FROM seats;  -- Should return 45