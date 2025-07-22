 // Utility for Parsing User Input

/**
 * Parses booking details from a WhatsApp message.
 * Expected message format:
 * Check-in date: DD/MM/YYYY
 * Check-out date: DD/MM/YYYY
 * Number of guests: X
 *
 * @param {string} message - The raw message text from the user.
 * @returns {Object} An object containing parsed details (`checkIn`, `checkOut`, `guests`)
 * and a `valid` boolean flag indicating successful parsing.
 */
function parseBookingDetails(message) {
    const lines = message.split('\n'); // Split the message into individual lines
    const details = { valid: false, checkIn: null, checkOut: null, guests: null };

    try {
        lines.forEach(line => {
            // Check for check-in date
            if (line.toLowerCase().includes('check-in date:')) {
                details.checkIn = line.split(':')[1]?.trim(); // Extract and trim the date part
            }
            // Check for check-out date
            else if (line.toLowerCase().includes('check-out date:')) {
                details.checkOut = line.split(':')[1]?.trim(); // Extract and trim the date part
            }
            // Check for number of guests
            else if (line.toLowerCase().includes('number of guests:')) {
                const guestsStr = line.split(':')[1]?.trim();
                details.guests = parseInt(guestsStr, 10); // Parse guests as an integer
            }
        });

        // Basic validation: ensure all required fields are present and guests is a valid number
        if (details.checkIn && details.checkOut && !isNaN(details.guests) && details.guests > 0) {
            // TODO: Add further validation for date formats
            // Check date format validation (e.g., regex for DD/MM/YYYY) or date validity
            // (e.g., check-in before check-out).
            details.valid = true;
        }
    } catch (error) {
        console.error('Error parsing booking details:', error);
        details.valid = false; // Mark as invalid if any parsing error occurs
    }

    return details;
}

module.exports = {
    parseBookingDetails
};
