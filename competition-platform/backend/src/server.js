// File Name: server.js
// Purpose: Entry point to start the server
// Written for beginner developers

// Server Entry Point - Force Restart Check
const { PORT } = require('./config/env');
const express = require('express');
const app = require('./app');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Force reload
