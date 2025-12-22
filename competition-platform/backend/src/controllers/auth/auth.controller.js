// File Name: auth.controller.js
// Purpose: specific logic for authentication routes

const supabase = require('../../config/supabaseClient');

const syncUser = async (req, res) => {
    try {
        const { uid, email, full_name, avatar_url, role: requestedRole } = req.body;

        if (!uid || !email) {
            return res.status(400).json({ error: 'UID and Email are required' });
        }

        console.log('Syncing user:', { email, requestedRole });

        // 1. Fetch Existing User (Secure Role Persistence)
        // If user already exists, we do NOT change their role based on frontend input
        const { data: existingUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', uid)
            .single();

        let finalRole = 'STUDENT'; // Default safe role

        if (existingUser) {
            finalRole = existingUser.role; // Preserve existing role
            console.log(`User exists. Preserving role: ${finalRole}`);
        } else {
            // 2. Validate Requested Role (New User)
            // STRICT SECURITY CHECK against Registries

            const upperRole = requestedRole ? requestedRole.toUpperCase() : 'STUDENT';

            if (upperRole === 'ADMIN') {
                // ADMIN role cannot be claimed from Frontend. Must be manually inserted in DB.
                console.warn(`Admin role requested for ${email}. Denied. Defaulting to STUDENT.`);
                finalRole = 'STUDENT';
            } else if (upperRole === 'FACULTY') {
                // Check Faculty Registry
                const { data: facultyEntry } = await supabase
                    .from('faculty_registry')
                    .select('email')
                    .eq('email', email)
                    .single();

                if (facultyEntry) {
                    finalRole = 'FACULTY';
                    console.log(`Faculty verified: ${email}`);
                } else {
                    console.warn(`Unverified Faculty request: ${email}. Defaulting to STUDENT.`);
                    finalRole = 'STUDENT';
                }
            } else if (upperRole === 'HOD') {
                // Check HOD Registry
                const { data: hodEntry } = await supabase
                    .from('hod_registry')
                    .select('email')
                    .eq('email', email)
                    .single();

                if (hodEntry) {
                    finalRole = 'HOD';
                    console.log(`HOD verified: ${email}`);
                } else {
                    console.warn(`Unverified HOD request: ${email}. Defaulting to STUDENT.`);
                    finalRole = 'STUDENT';
                }
            } else {
                // Default to Student for 'Student' or any unknown role
                finalRole = 'STUDENT';
            }
        }

        // 3. Upsert User with Final Verified Role
        // Using Service Role Key (admin access) to write to DB
        const { data, error } = await supabase
            .from('users')
            .upsert({
                id: uid,
                email: email,
                full_name: full_name,

                role: finalRole
                // created_at is default NOW(), updated_at removed as per schema
            }, { onConflict: 'id' })
            .select();

        if (error) {
            console.error('Error syncing user:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: 'User synced successfully', user: data, role: finalRole });

    } catch (err) {
        console.error('Unexpected error in syncUser:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    syncUser
};
