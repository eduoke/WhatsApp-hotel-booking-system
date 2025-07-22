const { getPool } = require('../config/db'); 

/**
 * Creates a new booking record in the database.
 * @param {string} phoneNumber - The user's phone number.
 * @param {Object} context - The conversation context containing selected hotel, booking details, and total amount.
 * @returns {number} The `insertId` (ID of the newly created booking) from the database.
 */
async function createBooking(phoneNumber, context) {
    const pool = getPool();
    const { selectedHotel, bookingDetails, totalAmount } = context;

    // Insert booking details into the 'bookings' table
    const [result] = await pool.execute(
        `INSERT INTO bookings (phone_number, hotel_id, check_in, check_out, guests, total_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`, // Initial status is 'pending'
        [
            phoneNumber,
            selectedHotel.id,
            bookingDetails.checkIn,
            bookingDetails.checkOut,
            bookingDetails.guests,
            totalAmount
        ]
    );

    return result.insertId; // Return the ID of the newly created booking
}

/**
 * Updates the payment status and M-Pesa transaction ID for a booking.
 * This function would typically be called by the M-Pesa callback endpoint
 * once payment confirmation is received.
 * @param {number} bookingId - The ID of the booking to update.
 * @param {string} status - The new status (e.g., 'paid', 'failed', 'cancelled').
 * @param {string|null} mpesaTransactionId - The M-Pesa transaction ID, or null if not applicable.
 */
async function updateBookingPaymentStatus(bookingId, status, mpesaTransactionId) {
    const pool = getPool();
    await pool.execute(
        'UPDATE bookings SET status = ?, mpesa_transaction_id = ?, updated_at = NOW() WHERE id = ?',
        [status, mpesaTransactionId, bookingId]
    );
}

module.exports = {
    createBooking,
    updateBookingPaymentStatus
};
