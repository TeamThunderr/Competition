// File Name: od.controller.js
// Purpose: Handle OD approvals by HOD
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Get pending OD requests for Department
const getPendingODRequests = async (req, res) => {
    try {
        const hod_dept = req.user ? req.user.department_id : null;
        console.log(`[HOD Debug] User ID: ${req.userId}, Role: ${req.user?.role}`);
        console.log(`[HOD Debug] Fetching Pending ODs for Dept ID: ${hod_dept}`);

        if (!hod_dept) {
            console.warn('[HOD Debug] Warning: HOD has no department_id assigned.');
        }

        // Simplified query - Include teams for proof and competitions for title/date
        const { data, error } = await supabase
            .from('od_requests')
            .select('*, is_extension, extension_count, parent_od_id, teams(proof_url, team_name), competitions(title, event_date)')
            .eq('status', 'PENDING');

        if (error) {
            console.error('[HOD Debug] Supabase Query Error:', JSON.stringify(error, null, 2));
            throw error;
        }

        console.log(`[HOD Debug] Raw query returned ${data ? data.length : 0} rows`);

        // Debug: Check if extension fields are present
        if (data && data.length > 0) {
            console.log('[HOD Debug] Sample OD fields:', Object.keys(data[0]));
            console.log('[HOD Debug] Extension fields check:', {
                is_extension: data[0].is_extension,
                extension_count: data[0].extension_count,
                parent_od_id: data[0].parent_od_id
            });
        }

        // Manually fetch user data for each request
        if (data && data.length > 0) {
            for (let i = 0; i < data.length; i++) {
                const req = data[i];
                console.log(`[HOD Debug] Request #${i} user_id: ${req.user_id}`);

                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('full_name, registration_no, department_id, section')
                    .eq('id', req.user_id)
                    .maybeSingle();

                if (userError) {
                    console.error(`[HOD Debug] User lookup error for request #${i}:`, userError);
                }

                req.users = userData;
                const match = userData?.department_id === hod_dept;
                console.log(`[HOD Debug] Request #${i} User Dept: ${userData?.department_id} | User Name: ${userData?.full_name} | Match? ${match}`);
            }

            // Filter by department
            const filtered = data.filter(req => req.users?.department_id === hod_dept);
            console.log(`[HOD] Returning ${filtered.length} requests after department filter`);
            return res.status(200).json(filtered);
        }

        res.status(200).json(data || []);

    } catch (err) {
        console.error('Get OD Requests Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Approve/Reject OD
const manageODRequest = async (req, res) => {
    try {
        const { request_id, status, timeSlot, duration } = req.body; // 'APPROVED' or 'REJECTED'
        const hod_id = req.userId;

        if (!request_id || !['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Valid Request ID and Status (APPROVED/REJECTED) are required' });
        }

        const { data, error } = await supabase
            .from('od_requests')
            .update({
                status: status,
                approved_by: hod_id,
                approved_at: new Date(),
                time_slot: timeSlot || 'Full Day',
                approved_days: duration ? parseInt(duration) : 1
            })
            .eq('id', request_id)
            .select();

        if (error) throw error;

        res.status(200).json({ message: `OD Request ${status} `, data: data[0] });

    } catch (err) {
        console.error('Manage OD Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getODRequestDetail = async (req, res) => {
    console.log(`getODRequestDetail called for ID: ${req.params.id}`);
    try {
        const { id } = req.params;
        const hod_dept = req.user.department_id;

        const { data, error } = await supabase
            .from('od_requests')
            .select(`
                *,
                is_extension, extension_count, parent_od_id,
                users:users!od_requests_user_id_fkey!inner(full_name, registration_no, department_id, section),
                competitions(title, event_date),
                teams (team_name, proof_url, verification_status, members_info)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        console.log("Fetched OD Request Data:", JSON.stringify(data, null, 2));

        // Security check: Ensure it belongs to HOD's dept
        if (data.users.department_id !== hod_dept) {
            return res.status(403).json({ error: 'Unauthorized: Student belongs to another department' });
        }

        res.status(200).json(data);

    } catch (err) {
        console.error('Get OD Detail Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getPendingODRequests,
    manageODRequest,
    getODRequestDetail
};
