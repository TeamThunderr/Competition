// File Name: server.js
// Purpose: Entry point to start the server
// Written for beginner developers

const { PORT } = require('./config/env');
const app = require('./app');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Force reload
