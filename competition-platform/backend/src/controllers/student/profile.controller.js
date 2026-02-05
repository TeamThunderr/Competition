const { sendResponse } = require('../../utils/responseHelper');
const supabase = require('../../config/supabaseClient');

const getProfile = async (req, res) => {
    try {
        const userId = req.userId;

        // 1. Fetch User Details
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*, departments(name)')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            console.error('Profile Fetch Error or User Not Found:', userError, userId);
            return sendResponse(res, 404, null, 'User not found');
        }

        console.log('DEBUG: Fetched User Keys:', Object.keys(user));
        console.log('DEBUG: User Full Name:', user.full_name);

        if (userError || !user) {
            console.error('Profile Fetch Error or User Not Found:', userError, userId);
            return sendResponse(res, 404, null, 'User not found');
        }

        console.log('DEBUG: Fetched User for Profile:', JSON.stringify(user));

        // Fetch Competition Stats (Registrations)
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('id, verified, competition_id')
            .eq('user_id', userId);

        if (regError) throw regError;

        // Fetch Competition Status (Winners/Shortlisted) - Handle missing table gracefully
        let statuses = [];
        try {
            const { data, error: statusError } = await supabase
                .from('competition_status')
                .select('is_winner, is_shortlisted, competition_id, competitions(title)')
                .eq('user_id', userId);

            if (statusError) throw statusError;
            statuses = data || [];
        } catch (err) {
            console.warn("Warning: Could not fetch competition_status (Table might be missing)", err.message);
            statuses = [];
        }

        // Filter statuses to only include those matching active registrations
        const registeredCompIds = new Set(registrations.map(r => r.competition_id));
        const validStatuses = statuses.filter(s => registeredCompIds.has(s.competition_id));

        // 3. Calculate Stats
        const totalCompetitions = registrations.length;
        const wins = validStatuses.filter(s => s.is_winner).length;
        const qualified = validStatuses.filter(s => s.is_shortlisted).length;

        // Simple participation points logic: 10 pts per reg, 50 pts per win
        const participationPoints = (totalCompetitions * 10) + (wins * 50);

        // 4. Calculate Batch (Heuristic)
        let batchLabel = 'N/A';
        if (user.registration_no) {
            const regNo = user.registration_no;
            let yearShort = null;
            const prefix = regNo.substring(0, 2);
            const mid = regNo.length >= 6 ? regNo.substring(4, 6) : null;

            // Heuristic for batch year
            if (parseInt(prefix) >= 15 && parseInt(prefix) <= 40) {
                yearShort = prefix;
            } else if (mid && parseInt(mid) >= 15 && parseInt(mid) <= 40) {
                yearShort = mid;
            }

            if (yearShort) {
                const startYear = 2000 + parseInt(yearShort, 10);
                const endYear = startYear + 4;
                batchLabel = `${startYear}-${endYear}`;
            }
        }

        // 5. Build Response
        const profileData = {
            name: user.full_name,
            email: user.email,
            role: user.role,
            regNo: user.registration_no,
            dept: user.departments?.name || 'Unknown',
            section: user.section || 'N/A',
            year: user.admission_year || 'N/A',
            batch: batchLabel,
            cgpa: user.cgpa || 'N/A',
            phone: user.phone_number || '',
            stats: {
                competitions: totalCompetitions,
                wins: wins,
                participation_points: participationPoints,
                qualified: qualified
            },
            competitionsWon: validStatuses.filter(s => s.is_winner).map(s => s.competitions.title),
            competitionsQualified: validStatuses.filter(s => s.is_shortlisted).map(s => s.competitions.title)
        };

        sendResponse(res, 200, profileData, 'Fetched profile successfully');

    } catch (err) {
        console.error('[ProfileController] Get Profile Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { phone_number } = req.body;

        // Only allowing phone number update for now
        if (phone_number === undefined) {
            return sendResponse(res, 400, null, 'No valid fields to update');
        }

        const { data, error } = await supabase
            .from('users')
            .update({ phone_number })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        sendResponse(res, 200, data, 'Profile updated successfully');

    } catch (err) {
        console.error('[ProfileController] Update Profile Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

// Search Students by Reg No (or Name)
const searchStudent = async (req, res) => {
    try {
        const { query } = req.query; // e.g. ?query=7100
        if (!query || query.length < 3) {
            return sendResponse(res, 400, null, 'Search query must be at least 3 characters');
        }

        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, registration_no, department_id, section, departments(name)')
            .ilike('registration_no', `%${query}%`)
            .eq('role', 'student')
            .limit(5); // Limit results

        if (error) throw error;

        sendResponse(res, 200, data, 'Students found');
    } catch (err) {
        console.error('[ProfileController] Search Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

module.exports = {
    getProfile,
    updateProfile,
    searchStudent
};
