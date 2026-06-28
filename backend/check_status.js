const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
    return client.query("UPDATE competition_status SET is_shortlisted = false WHERE competition_id='e1bf2f56-8e3e-4c7b-a569-d87e758c22da' AND user_id='0c665824-bf0f-4555-bf63-1494ac28db81'");
}).then(() => {
    console.log("Fixed user status");
    client.end();
}).catch(console.error);
