
require('dotenv').config();
const supabase = require('../config/supabaseClient');

const verifyConnection = async () => {
    console.log('Testing Supabase Connection...');
    try {
        const { data, error } = await supabase.from('users').select('*').limit(1);
        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Supabase Connection Successful!');
            console.log('Data:', data);
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
};

verifyConnection();
