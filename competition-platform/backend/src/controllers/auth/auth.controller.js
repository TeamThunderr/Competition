// File Name: auth.controller.js
// Purpose: specific logic for authentication routes

const supabase = require('../../config/supabaseClient');

const login = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        console.log('Login attempt for:', email);

        // 1. Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        let finalRole = 'STUDENT';
        let fullName = email.split('@')[0]; // Default name from email

        if (existingUser) {
            console.log(`User found: ${existingUser.email} (${existingUser.role})`);
            finalRole = existingUser.role;
            fullName = existingUser.full_name;
        } else {
            // 2. New User - Determine Role from Registries
            console.log('New user. Checking registries...');

            // Check Faculty Registry
            const { data: facultyEntry } = await supabase
                .from('faculty_registry')
                .select('email, full_name') // Assuming registry has names
                .eq('email', email)
                .single();

            if (facultyEntry) {
                finalRole = 'FACULTY';
                if (facultyEntry.full_name) fullName = facultyEntry.full_name;
                console.log('Found in Faculty Registry');
            } else {
                // Check HOD Registry
                const { data: hodEntry } = await supabase
                    .from('hod_registry')
                    .select('email, full_name')
                    .eq('email', email)
                    .single();

                if (hodEntry) {
                    finalRole = 'HOD';
                    if (hodEntry.full_name) fullName = hodEntry.full_name;
                    console.log('Found in HOD Registry');
                } else {
                    console.log('Not in registries. Defaulting to STUDENT.');
                }
            }
        }

        // 3. Upsert User (Sync)
        // For new users without Supabase Auth, we generate a random UUID if needed.
        // Ideally we should use a consistent ID if possible, but randomUUID works for "No Auth" bypass.
        let userId = existingUser ? existingUser.id : crypto.randomUUID();

        const { data: upsertedUser, error: upsertError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                email: email,
                full_name: fullName,
                role: finalRole
            }, { onConflict: 'email' })
            .select()
            .single();

        if (upsertError) {
            console.error('Upsert Error:', upsertError);
            // Fallback: Try to just get the user if upsert fails
            const { data: fallbackUser } = await supabase.from('users').select('*').eq('email', email).single();
            if (fallbackUser) {
                return res.status(200).json({ message: 'Login successful', user: fallbackUser, role: fallbackUser.role });
            }
            return res.status(500).json({ error: upsertError.message });
        }

        res.status(200).json({ message: 'Login successful', user: upsertedUser, role: finalRole });

    } catch (err) {
        console.error('Unexpected error in login:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    login
};
