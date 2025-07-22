const { getPool } = require('../config/db'); 

/**
 * Retrieves a list of hotels from the database based on location.
 * Uses a LIKE query for partial matching.
 * @param {string} location - The location string to search for (case-insensitive).
 * @returns {Array<Object>} An array of hotel objects.
 */
async function getHotelsByLocation(location) {
    const pool = getPool();
    const [rows] = await pool.execute(
        'SELECT id, name, location, price_per_night, amenities FROM hotels WHERE LOWER(location) LIKE ? LIMIT 10',
        [`%${location.toLowerCase()}%`] // Use LOWER() for case-insensitive search
    );
    return rows;
}

/**
 * Retrieves a list of hotels from the database based on hotel name.
 * Uses a LIKE query for partial matching.
 * @param {string} name - The hotel name or part of the name to search for (case-insensitive).
 * @returns {Array<Object>} An array of hotel objects.
 */
async function getHotelsByName(name) {
    const pool = getPool();
    const [rows] = await pool.execute(
        'SELECT id, name, location, price_per_night, amenities FROM hotels WHERE LOWER(name) LIKE ? LIMIT 10',
        [`%${name.toLowerCase()}%`] // Use LOWER() for case-insensitive search
    );
    return rows;
}

module.exports = {
    getHotelsByLocation,
    getHotelsByName
};
