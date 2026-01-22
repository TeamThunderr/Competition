
require('dotenv').config();
const statsService = require('./src/services/admin/stats.service');
const supabase = require('./src/config/supabaseClient');

async function debugStats() {
    try {
        console.log('--- Starting Debugging Stats ---');
        console.log('Calling getDepartmentStats...');
        const stats = await statsService.getDepartmentStats();
        console.log('Stats fetched successfully:', stats.length, 'entries');
    } catch (err) {
        console.error('--- ERROR CAUGHT ---');
        console.error(err);
        if (err.message) console.error('Message:', err.message);
        if (err.stack) console.error('Stack:', err.stack);
    }
}

debugStats();
