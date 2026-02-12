const supabase = require('../config/supabaseClient');

async function debugWinner() {
    console.log('--- START DEBUG ---');
    try {
        // 1. Get Student
        const { data: student, error: sErr } = await supabase
            .from('users')
            .select('id, full_name, registration_no')
            .eq('registration_no', '24CS0002') // Balaji V
            .single();

        if (sErr) throw sErr;
        console.log('Student:', student);

        // 2. Get Competition
        const { data: comp, error: cErr } = await supabase
            .from('competitions')
            .select('id, title')
            .ilike('title', '%Gamejam%')
            .single();

        if (cErr) throw cErr;
        console.log('Competition:', comp);

        // 3. Get Registration
        const { data: reg, error: rErr } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', student.id)
            .eq('competition_id', comp.id);

        if (rErr) throw rErr;
        console.log('Registration Raw Data:', reg);

        // 4. Get Status
        const { data: status, error: stErr } = await supabase
            .from('competition_status')
            .select('*')
            .eq('user_id', student.id)
            .eq('competition_id', comp.id);

        if (stErr) throw stErr;
        console.log('Competition Status Raw Data:', status);

    } catch (err) {
        console.error('Debug Error:', err);
    }
    console.log('--- END DEBUG ---');
}

debugWinner();
