const supabase = require('./config/supabaseClient');

async function checkUser() {
    console.log('Checking user details...');

    // Fetch user by email (from screenshot)
    const email = 'balajiv.cse2024@citchennai.net';

    const { data, error } = await supabase
        .from('users')
        .select('*') // Select all columns to see what we have
        .eq('email', email)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return;
    }

    console.log('User Record:', data);
    console.log('Department ID:', data.department_id);

    if (!data.department_id) {
        console.log('⚠️  FAIL: department_id is NULL or empty.');

        // AUTO-FIX
        console.log('🛠️ Attempting Auto-Fix...');
        const { data: cseDept } = await supabase.from('departments').select('id').eq('name', 'CSE').single();

        if (cseDept) {
            console.log(`   Found CSE Department ID: ${cseDept.id}`);
            const { error: updateError } = await supabase
                .from('users')
                .update({ department_id: cseDept.id })
                .eq('email', email);

            if (!updateError) {
                console.log('   ✅ Successfully updated user to CSE department!');
            } else {
                console.error('   ❌ Failed to update user:', updateError.message);
            }
        } else {
            console.log('   ❌ Could not find "CSE" department to link.');
        }

    } else {
        console.log('✅ PASS: department_id is present:', data.department_id);
    }

    // Also list departments
    const { data: depts } = await supabase.from('departments').select('id, name');
    console.log('\nAvailable Departments:', JSON.stringify(depts));
}

checkUser();
