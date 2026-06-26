require('dotenv').config({ path: '.env.production' });
const supabase = require('./src/config/supabaseClient');
async function fixEmails() {
    console.log("Fetching users...");
    const { data: users, error } = await supabase.from('users').select('id, email');
    if (error) { console.error('Error fetching:', error); return; }
    
    let updated = 0;
    for (const user of users) {
        if (!user.email) continue;
        const fixedEmail = user.email.trim().toLowerCase();
        if (user.email !== fixedEmail) {
            console.log(`Fixing: '${user.email}' -> '${fixedEmail}'`);
            await supabase.from('users').update({ email: fixedEmail }).eq('id', user.id);
            updated++;
        }
    }
    console.log('Total fixed:', updated);
}
fixEmails();
