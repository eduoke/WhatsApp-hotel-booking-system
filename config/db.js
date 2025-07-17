const { Pool } = require('pg'); 
const settings = require('../settings');

let pool; 

/**
 * Asynchronously initializes and connects to the PostgreSQL database pool.
 * Performs an initial connection test to ensure connectivity.
 * @returns {Pool} The initialized PostgreSQL connection pool.
 * @throws {Error} If the database connection fails.
 */
async function connectDB() {
    if (pool) {
        // If pool already exists, return it to prevent re-initialization
        return pool;
    }

    pool = new Pool({
        user: settings.DB_USER,
        host: settings.DB_HOST,
        database: settings.DB_DATABASE,
        password: settings.DB_NAME,
        port: settings.DB_PORT,
        connectionTimeoutMillis: 5000, // 5 seconds connection timeout
    });

    // Event listener for successful database connection
    pool.on('connect', () => {
        console.log('Successfully connected to PostgreSQL database!');
    });

    // Event listener for database errors
    pool.on('error', (err) => {
        console.error('Unexpected error on idle client:', err);
        // For a critical error like this, exiting might be appropriate.
        process.exit(1);
    });

    try {
        // Test the connection by acquiring and releasing a client
        const client = await pool.connect();
        client.release(); // Release the client immediately after testing
        console.log('PostgreSQL database connection tested successfully!');
        return pool; // Return the initialized pool
    } catch (err) {
        console.error('Failed to connect to PostgreSQL database:', err.message);
        // Rethrow the error to be caught by the calling function (e.g., in index.js)
        throw err;
    }
}

// Export the async function to initialize the database
module.exports = {
    connectDB,
};