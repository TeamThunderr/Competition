// File Name: server.js
// Purpose: Entry point to start the server
// Written for beginner developers

const app = require('./app');
const { PORT } = require('./config/env');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
