// File Name: team.controller.js
// Purpose: Manage teams and memberships
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Create a new team
const createTeam = async (req, res) => {
    try {
        const { competition_id, team_name } = req.body;
        const leader_id = req.userId; // From middleware

        if (!competition_id || !team_name) {
            return res.status(400).json({ error: 'Competition ID and Team Name are required' });
        }

        // 1. Create the team
        const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .insert([{ competition_id, leader_id, team_name }])
            .select()
            .single();

        if (teamError) return res.status(500).json({ error: teamError.message });

        // 2. Add leader as a member (Status: ACCEPTED)
        const { error: memberError } = await supabase
            .from('team_members')
            .insert([{
                team_id: teamData.id,
                user_id: leader_id,
                invite_status: 'ACCEPTED'
            }]);

        if (memberError) {
            // Rollback (delete team) if member creation fails - optional but good practice
            await supabase.from('teams').delete().eq('id', teamData.id);
            return res.status(500).json({ error: memberError.message });
        }

        res.status(201).json({ message: 'Team created successfully', team: teamData });
    } catch (err) {
        console.error('Error creating team:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Invite a member to the team
const inviteMember = async (req, res) => {
    try {
        const { team_id, email } = req.body;
        const requesterId = req.userId;

        // 1. Verify requester is the leader
        const { data: team } = await supabase
            .from('teams')
            .select('leader_id')
            .eq('id', team_id)
            .single();

        if (!team || team.leader_id !== requesterId) {
            return res.status(403).json({ error: 'Only the team leader can invite members' });
        }

        // 2. Find the user by email
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (!user) {
            return res.status(404).json({ error: 'User with this email not found' });
        }

        // 3. Send Invite
        const { error: inviteError } = await supabase
            .from('team_members')
            .insert([{
                team_id,
                user_id: user.id,
                invite_status: 'PENDING'
            }]);

        if (inviteError) return res.status(500).json({ error: inviteError.message });

        res.status(200).json({ message: 'Invitation sent' });
    } catch (err) {
        console.error('Error inviting member:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Accept an invitation
const acceptInvite = async (req, res) => {
    try {
        const { team_id } = req.body;
        const userId = req.userId;

        const { error } = await supabase
            .from('team_members')
            .update({ invite_status: 'ACCEPTED' })
            .eq('team_id', team_id)
            .eq('user_id', userId);

        if (error) return res.status(500).json({ error: error.message });

        res.status(200).json({ message: 'Invitation accepted' });
    } catch (err) {
        console.error('Error accepting invite:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    createTeam,
    inviteMember,
    acceptInvite
};
