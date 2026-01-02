
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const migrate = async () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL not found in .env. Please run the SQL manually.');
        console.log('SQL File: backend/Database/SCHEMA_UPDATE_PARTICIPATION.SQL');
        process.exit(1);
    }

    const client = new Client({ connectionString });

    try {
        await client.connect();

        // 1. Add google_refresh_token
        console.log('Adding google_refresh_token to users...');
        try {
            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;');
            console.log('google_refresh_token added or already exists.');
        } catch (e) {
            console.error('Error adding column:', e.message);
        }

        // 2. Run Participation Schema
        const sqlPath = path.join(__dirname, '../../Database/SCHEMA_UPDATE_PARTICIPATION.SQL');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running SCHEMA_UPDATE_PARTICIPATION.SQL...');
        await client.query(sql);
        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
};

migrate();
