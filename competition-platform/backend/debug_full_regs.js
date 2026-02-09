const supabase = require('./src/config/supabaseClient');
const fs = require('fs');

const debugFullRegs = async () => {
    const email = 'smithc.cse2024@citchennai.net';
    const { data: users } = await supabase.from('users').select('id, full_name').eq('email', email);
    if (!users || users.length === 0) return;
    const userId = users[0].id;
    const { data: registrations } = await supabase.from('registrations').select('status, shortlist_verified, qualification_verified, competitions(title)').eq('user_id', userId);
    if (!registrations) return;
    fs.writeFileSync('debug_regs_v4.json', JSON.stringify(registrations, null, 2));
};
debugFullRegs();
