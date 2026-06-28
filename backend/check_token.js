const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
    return client.query("SELECT email, google_refresh_token FROM users WHERE email='libinantoe.aids2024@citchennai.net'");
}).then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
    client.end();
}).catch(console.error);
