const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const settings = require('./config/vars'); // Import application settings
const { connectDB } = require('./config/db'); // Import the async connectDB function
const mainRouter = require('./routes'); // Import the main router from routes/index.js

const app = express();
const port = settings.PORT;

// --- Express Middleware ---
app.use(express.json()); // Middleware to parse JSON request bodies

// --- Start Server Function ---
// We wrap the server startup logic in an async function to use await for connectDB
async function startServer() {
    try {
        // Initialize the database connection pool
        // This will also perform the initial connection test
        const dbPool = await connectDB();
        // You can now pass dbPool to your controllers if needed,
        // or rely on the fact that `config/db.js` exports the `pool` directly
        // for other modules that `require` it.

        // --- Routes ---
        // Use the main router for all API routes.
        app.use('/api', mainRouter);

        // Basic root route
        app.get('/', (req, res) => {
            res.send('Welcome to the your WhatsApp Hotel Booking System API!');
        });

        // --- Global Error Handling Middleware (Optional) ---
        // If you create an errorHandler.js in your middleware folder, you would uncomment this:
        // app.use(require('./middleware/errorHandler'));

        // --- Start the Express Server ---
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
            console.log('To test the DB connection, visit: http://localhost:' + port + '/api/test/test-db-connection');
        });
    } catch (err) {
        console.error('Failed to start server due to database connection error:', err);
        process.exit(1); // Exit the process if the server cannot start without a DB connection
    }
}

// Call the async function to start the server
startServer();
