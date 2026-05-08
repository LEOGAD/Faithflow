const express = require('express');
const path = require('path');
const app = require('./api/index'); // Import the app logic we already built

// Render provides a PORT environment variable
const PORT = process.env.PORT || 10000;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '.')));

// Fallback for root: if not logged in, go to login.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Render Server running on port ${PORT}`);
});
