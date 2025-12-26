const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyQuery() {
    try {
        console.log("Testing Supabase Query...");
        const { data, error } = await supabase
            .from('competitions')
            .select('id, title, registrations(count)')
            .limit(1);

        if (error) {
            console.error("Query Error:", error);
        } else {
            console.log("Query Successful. Data Sample:");
            console.log(JSON.stringify(data, null, 2));

            if (data.length > 0) {
                const row = data[0];
                console.log("Has 'registrations' property?", row.hasOwnProperty('registrations'));
                console.log("Value of 'registrations':", row.registrations);
            }
        }
    } catch (e) {
        console.error("Script Error:", e);
    }
}

verifyQuery();
