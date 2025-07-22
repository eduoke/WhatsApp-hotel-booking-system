// Utility for Date Calculations

/**
 * Calculates the number of nights between a check-in and check-out date.
 * Dates are expected in DD/MM/YYYY string format.
 *
 * @param {string} checkIn - The check-in date string (DD/MM/YYYY).
 * @param {string} checkOut - The check-out date string (DD/MM/YYYY).
 * @returns {number} The number of nights. Returns 0 or throws an error if dates are invalid.
 */
function calculateNights(checkIn, checkOut) {
    // Convert DD/MM/YYYY format to YYYY-MM-DD for reliable Date object parsing
    // This avoids potential issues with browser-specific date parsing for DD/MM/YYYY.
    // https://stackoverflow.com/questions/3566125/problem-with-date-formats-in-javascript-with-different-browsers
    // https://medium.com/@ranuranjan25/how-a-simple-date-broke-my-app-in-safari-but-worked-fine-in-chrome-6b51f023e650
    const [dayIn, monthIn, yearIn] = checkIn.split('/');
    const [dayOut, monthOut, yearOut] = checkOut.split('/');

    const startDate = new Date(`${yearIn}-${monthIn}-${dayIn}`);
    const endDate = new Date(`${yearOut}-${monthOut}-${dayOut}`);

    // Validate if the Date objects were successfully created and if check-out is after check-in
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
        console.error('Invalid dates provided for calculating nights or check-out is not after check-in:', checkIn, checkOut);
        // TODO: Implement different error handling strategies
        // throw new Error('Invalid date range for booking.');
        return 0; // Return 0 nights for invalid date ranges
    }

    // Calculate the difference in milliseconds
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());

    // Convert milliseconds to days and round up to ensure full nights are counted.
    // Example: 24 hours = 1 night. If check-in is 10 AM and check-out is 10 AM next day, it's 1 night.
    // If check-in is 10 AM and check-out is 11 AM next day, it's still 1 night (or 2 if partial days count).
    // Math.ceil ensures that even a partial day difference counts as a full night.
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

module.exports = {
    calculateNights
};
