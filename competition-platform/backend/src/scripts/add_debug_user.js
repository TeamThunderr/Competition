const supabase = require('../config/supabaseClient');

async function addDebugUser() {
    console.log('Adding/Updating debug user...');

    const user = {
        email: 'balajiv.cse2024@citchennai.net',
        full_name: 'Balaji V',
        role: 'STUDENT',
        // Assuming we need a valid department_id. check_user.js tries to find 'CSE'.
        // We will do a robust lookup here.
    };

    try {
        // 1. Get Dept ID
        const { data: deptData, error: deptError } = await supabase
            .from('departments')
            .select('id')
            .eq('name', 'CSE')
            .single();

        if (deptError) {
            console.error('Error finding CSE department:', deptError.message);
            // Try to create it if missing? Or just fail.
            // For now, let's assume it exists or fail.
        }

        if (deptData) {
            user.department_id = deptData.id;
        }

        // 2. Upsert User
        const { data, error } = await supabase
            .from('users')
            .upsert(user, { onConflict: 'email' })
            .select();

        if (error) {
            console.error('Error upserting user:', error.message);
        } else {
            console.log('User upserted successfully:', data);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

addDebugUser();
