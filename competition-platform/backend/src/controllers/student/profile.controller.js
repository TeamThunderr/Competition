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
            .select('id, verified, shortlist_proof_url, qualification_verified, competition_id, status, won_status, winning_verified, competitions(title)')
            .eq('user_id', userId);

        if (regError) throw regError;

        // 3. Calculate Stats
        // Participation only counts if the basic registration proof is verified
        const verifiedRegistrations = registrations.filter(r => r.verified === true);
        const totalCompetitions = verifiedRegistrations.length;

        // Wins: Must be marked as WON and Verified by Faculty
        const winnerRegistrations = registrations.filter(r =>
            r.won_status === 'WON' && r.winning_verified === true
        );
        const wins = winnerRegistrations.length;

        // Qualification: Must be Verified
        // We include Winners in Qualified count or keep them separate? 
        // "Competitions Qualified" usually implies you passed the shortlist stage. 
        // Logic: verification of qualification OR winning verification (implies qualification)
        const qualifiedRegistrations = registrations.filter(r =>
            (r.qualification_verified === true || r.winning_verified === true) &&
            // Optional: Exclude if they are winners and you only want "Qualified but not won" in the list
            // For now, listing all qualified competitions including those they won is safer.
            // But to match dashboard "Qualified" vs "Winner" badges, we might want to distinct.
            // Let's list ALL qualified for the "Qualified" stats, but maybe distinct the list? 
            // Implementation Plan said: "Qualified: qualification_verified === true AND (won_status !== 'WON' OR winning_verified !== true)"
            // Let's follow the plan for the LIST, but for STATS count? 
            // Stats usually overlap. If you won, you also qualified. 
            // Let's sticking to: 
            // Stats Qualified: Count of registrations where qualification_verified is true OR winning_verified is true.
            // List Qualified: Only those NOT in the Winner list to avoid duplicates.
            true
        );

        // List for UI - Distinct from Winners
        const qualifiedListRegistrations = registrations.filter(r =>
            r.qualification_verified === true &&
            !(r.won_status === 'WON' && r.winning_verified === true)
        );

        const qualified = qualifiedRegistrations.length;

        // Simple participation points logic: 10 pts per verified reg, 50 pts per win
        // Maybe extra 20 for qualification?
        // Let's stick to Plan: 10 per participation, 50 per win.
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
            competitionsWon: winnerRegistrations.map(r => r.competitions?.title || 'Unknown'),
            competitionsQualified: qualifiedListRegistrations.map(r => r.competitions?.title || 'Unknown')
        };

        sendResponse(res, 200, profileData, 'Fetched profile successfully');

    } catch (err) {
        console.error('[ProfileController] Get Profile Error (FULL):', JSON.stringify(err, null, 2));
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
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
