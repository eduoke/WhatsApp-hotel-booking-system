const express = require('express');
const router = express.Router(); 

const testRoutes = require('./test'); // Routes for testing purposes

router.use('/test', testRoutes);

// You would add more routes here as your app grows, e.g.:
// const userRoutes = require('./users');
// router.use('/users', userRoutes);

module.exports = router; 
