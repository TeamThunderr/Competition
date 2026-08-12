const supabase = require('../../config/supabaseClient');
const discoveryJobService = require('../../services/discovery/competitionDiscoveryJob.service');
const discoveryService = require('../../services/discovery/competitionDiscovery.service');
const candidateService = require('../../services/discovery/competitionCandidate.service');
const { addCompetitionDiscoveryJob } = require('../../queues/gmailSync.queue');

const getDiscoveryMailboxConfig = async () => {
    const mailboxEmail = (process.env.COMPETITION_DISCOVERY_MAILBOX || '').trim().toLowerCase();
    const senderFilter = (process.env.COMPETITION_DISCOVERY_SENDER || '').trim().toLowerCase();

    if (!mailboxEmail || !senderFilter) {
        throw new Error('Discovery config missing. Set COMPETITION_DISCOVERY_MAILBOX and COMPETITION_DISCOVERY_SENDER.');
    }

    const { data: mailbox, error } = await supabase
        .from('users')
        .select('id, email, google_refresh_token')
        .eq('email', mailboxEmail)
        .single();

    if (error || !mailbox) {
        throw new Error(`Discovery mailbox user not found: ${mailboxEmail}`);
    }
    if (!mailbox.google_refresh_token) {
        throw new Error(`Discovery mailbox does not have Gmail authorization: ${mailboxEmail}`);
    }

    return { mailbox, senderFilter };
};

const triggerDiscoverySync = async (req, res) => {
    try {
        const requestedBy = req.user.id;
        const { mailbox, senderFilter } = await getDiscoveryMailboxConfig();
        const job = await discoveryJobService.createDiscoveryJob({
            mailboxUserId: mailbox.id,
            requestedBy,
            mailboxEmail: mailbox.email,
            senderFilter
        });

        if (job.alreadyRunning) {
            return res.status(409).json({
                success: false,
                error: 'Discovery already in progress',
                message: job.message,
                jobId: job.jobId
            });
        }

        const queueJobId = await addCompetitionDiscoveryJob({ jobType: 'DISCOVERY', discoveryJobId: job.jobId });
        await discoveryJobService.attachBossJobId(job.jobId, queueJobId);

        return res.status(202).json({
            success: true,
            message: 'Competition discovery started',
            jobId: job.jobId,
            queueJobId
        });
    } catch (err) {
        console.error('[Discovery] Trigger failed:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

const listCompetitionCandidates = async (req, res) => {
    try {
        const { status } = req.query;
        let query = supabase
            .from('competition_candidates')
            .select('*')
            .order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('[Discovery] List candidates failed:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

const getCompetitionCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('competition_candidates')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('[Discovery] Get candidate failed:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

const updateCompetitionCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body || {};
        const candidate = candidateService.validateCandidateData({
            competition_name: updates.title || updates.competition_name,
            organizer: updates.organizer,
            description: updates.description,
            category: updates.category,
            platform: updates.platform,
            eligibility: updates.eligibility,
            registration_deadline: updates.registration_deadline,
            event_date: updates.event_date,
            mode: updates.mode,
            location: updates.venue || updates.location,
            registration_url: updates.external_link,
            official_url: updates.official_url,
            contact_information: updates.contact_information,
            confidence_score: typeof updates.confidence_score === 'number' ? updates.confidence_score : null
        });
        if (!candidate.valid) {
            return res.status(400).json({ success: false, error: candidate.reason });
        }
        const { data, error } = await supabase
            .from('competition_candidates')
            .update({
                ...candidate.candidate,
                ai_extracted_json: updates.ai_extracted_json || {},
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('[Discovery] Update candidate failed:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

const approveCompetitionCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const reviewedBy = req.user.id;
        const candidate = await supabase
            .from('competition_candidates')
            .select('*')
            .eq('id', id)
            .single();
        if (candidate.error || !candidate.data) throw new Error('Candidate not found');
        const competitionId = await candidateService.approveCandidate({
            candidateId: id,
            reviewedBy,
            updates: req.body || {}
        });
        return res.status(200).json({ success: true, competition_id: competitionId });
    } catch (err) {
        console.error('[Discovery] Approve candidate failed:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

const rejectCompetitionCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const reviewedBy = req.user.id;
        const { rejection_reason } = req.body || {};
        const { data, error } = await supabase
            .from('competition_candidates')
            .update({
                status: 'REJECTED',
                reviewed_by: reviewedBy,
                reviewed_at: new Date().toISOString(),
                rejection_reason: rejection_reason || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('[Discovery] Reject candidate failed:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    triggerDiscoverySync,
    listCompetitionCandidates,
    getCompetitionCandidate,
    updateCompetitionCandidate,
    approveCompetitionCandidate,
    rejectCompetitionCandidate
};
