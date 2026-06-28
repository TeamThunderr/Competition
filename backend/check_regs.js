const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
    return client.query("SELECT user_id, status, source, matched_keyword, remarks FROM registrations WHERE competition_id='e1bf2f56-8e3e-4c7b-a569-d87e758c22da'");
}).then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
    client.end();
}).catch(console.error);
