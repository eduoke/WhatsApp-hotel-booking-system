// Database Operations for Conversation States
const { getPool } = require('../config/db'); // Get the initialized postgresSQL connection pool
const { STATES } = require('../config/constants'); 

/**
 * Retrieves a conversation record from the database by phone number.
 * @param {string} phoneNumber - The user's phone number.
 * @returns {Object|null} The conversation object if found, otherwise null.
 */
async function getConversation(phoneNumber) {
    const pool = getPool(); // Get the active database pool
    const [rows] = await pool.execute(
        'SELECT * FROM conversations WHERE phone_number = ?',
        [phoneNumber]
    );
    return rows[0] || null; // Return the first row or null if no record found
}

/**
 * Creates a new conversation record in the database for a given phone number.
 * Initializes the conversation with the WELCOME state and an empty context.
 * @param {string} phoneNumber - The user's phone number.
 * @returns {Object} The newly created conversation object.
 */
async function createConversation(phoneNumber) {
    const pool = getPool();
    await pool.execute(
        'INSERT INTO conversations (phone_number, current_state, context) VALUES (?, ?, ?)',
        [phoneNumber, STATES.WELCOME, '{}'] // Initialize with WELCOME state and empty JSON context
    );
    // After insertion, fetch the newly created conversation to return it
    return await getConversation(phoneNumber);
}

/**
 * Updates the state and context of an existing conversation.
 * Also updates the `last_activity` timestamp.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} state - The new state of the conversation (e.g., 'browse_hotels').
 * @param {Object} context - The new context object for the conversation. This will be stringified to JSON.
 */
async function updateConversationState(phoneNumber, state, context) {
    const pool = getPool();
    await pool.execute(
        'UPDATE conversations SET current_state = ?, context = ?, last_activity = NOW() WHERE phone_number = ?',
        [state, JSON.stringify(context), phoneNumber] // Stringify context object to store as JSON
    );
}

module.exports = {
    getConversation,
    createConversation,
    updateConversationState
};
