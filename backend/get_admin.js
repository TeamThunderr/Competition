const supabase = require('./src/config/supabaseClient');

async function getAdmin() {
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    console.log("Total Users in DB:", count);
}
getAdmin();
