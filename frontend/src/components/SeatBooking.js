import React, { useState, useEffect } from 'react';
import '../styles/SeatBooking.css';

const SeatBooking = () => {
  const [seats, setSeats] = useState([]);
  const [passengerCount, setPassengerCount] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSeats();
  }, []);

  const fetchSeats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/seats');
      const data = await response.json();
      setSeats(data);
    } catch (err) {
      console.error('Error fetching seats:', err);
    }
  };

  const allocateSeats = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/seats/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: passengerCount }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to book seats');
        return;
      }
      
      const updatedSeats = await response.json();
      setSeats(prevSeats => 
        prevSeats.map(seat => {
          const updatedSeat = updatedSeats.find(s => s.id === seat.id);
          return updatedSeat ? updatedSeat : seat;
        })
      );
    } catch (err) {
      console.error('Error booking seats:', err);
      alert('Failed to book seats');
    } finally {
      setLoading(false);
    }
  };

  const resetSeats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/seats/reset', {
        method: 'POST',
      });
      const data = await response.json();
      setSeats(data);
    } catch (err) {
      console.error('Error resetting seats:', err);
    }
  };

  // Group seats by row for display
  const rows = {};
  seats.forEach(seat => {
    if (!rows[seat.row_number]) {
      rows[seat.row_number] = [];
    }
    rows[seat.row_number].push(seat);
  });

  return (
    <div className="seat-booking">
      <h2>Smart Ticket Booking System</h2>
      
      <div className="controls">
        <label htmlFor="passengerCount">Select number of passengers (1–7):</label>
        <select 
          id="passengerCount" 
          value={passengerCount}
          onChange={(e) => setPassengerCount(Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))}
        >
          {[1, 2, 3, 4, 5, 6, 7].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
        <button onClick={allocateSeats} disabled={loading}>
          {loading ? 'Booking...' : 'Book Seats'}
        </button>
        <button onClick={resetSeats}>Reset All</button>
      </div>

      <div className="seating-area">
        {Object.entries(rows).map(([rowNumber, rowSeats]) => (
          <div key={rowNumber} className="row">
            <strong>Row {rowNumber}:</strong>
            {rowSeats.map(seat => (
              <div 
                key={`${rowNumber}-${seat.seat_number}`}
                className={`seat ${seat.is_booked ? 'filled' : 'vacant'}`}
              >
                {seat.seat_number}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeatBooking;