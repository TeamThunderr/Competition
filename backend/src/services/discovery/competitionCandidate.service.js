const supabase = require('../../config/supabaseClient');

const normalizeTitle = (title = '') => {
    return title
        .toString()
        .toLowerCase()
        .replace(/\b(announcement|reminder|deadline|extended|final|registration|open|now|2023|2024|2025|2026|2027)\b/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const normalizeUrl = (url) => {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        parsed.hash = '';
        parsed.searchParams.sort();
        return parsed.toString().replace(/\/$/, '');
    } catch (_) {
        return null;
    }
};

const parseDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
};

const validateCandidateData = (data) => {
    const title = data.competition_name || data.title;
    if (!title || title.toString().trim().length < 3) {
        return { valid: false, reason: 'Competition title is missing or too short' };
    }

    const registrationUrl = normalizeUrl(data.registration_url || data.external_link);
    const officialUrl = normalizeUrl(data.official_url);
    const registrationDeadline = parseDate(data.registration_deadline);
    const eventDate = parseDate(data.event_date);

    return {
        valid: true,
        candidate: {
            title: title.toString().trim(),
            normalized_title: normalizeTitle(title),
        organizer: data.organizer || null,
        description: data.description || null,
        category: data.category || null,
        platform: data.platform || null,
        eligibility: data.eligibility || null,
            registration_deadline: registrationDeadline,
            event_date: eventDate,
            mode: data.mode || null,
            venue: data.location || data.venue || null,
            external_link: registrationUrl,
            official_url: officialUrl,
            contact_information: data.contact_information || null,
            confidence_score: typeof data.confidence_score === 'number' ? data.confidence_score : null
        }
    };
};

const findDuplicate = async (candidate) => {
    const urls = [candidate.external_link, candidate.official_url].filter(Boolean);

    if (urls.length > 0) {
        const { data: existingByUrl } = await supabase
            .from('competitions')
            .select('id, title, organizer, external_link, event_date')
            .in('external_link', urls)
            .limit(1);
        if (existingByUrl && existingByUrl.length > 0) {
            return { type: 'competition', id: existingByUrl[0].id };
        }
    }

    if (candidate.normalized_title) {
        const { data: pendingCandidates } = await supabase
            .from('competition_candidates')
            .select('id, title, organizer, event_date, external_link, official_url, normalized_title')
            .eq('normalized_title', candidate.normalized_title)
            .in('status', ['PENDING_REVIEW', 'APPROVED'])
            .limit(1);

        const matchedCandidate = (pendingCandidates || []).find(row => {
            const sameOrganizer = candidate.organizer && row.organizer &&
                row.organizer.toLowerCase() === candidate.organizer.toLowerCase();
            const sameDate = candidate.event_date && row.event_date === candidate.event_date;
            const sameUrl = urls.some(url => url === row.external_link || url === row.official_url);
            return sameUrl || sameOrganizer || sameDate;
        });

        if (matchedCandidate) {
            return { type: 'candidate', id: matchedCandidate.id };
        }

        let query = supabase
            .from('competitions')
            .select('id, title, organizer, event_date')
            .ilike('title', `%${candidate.title.slice(0, 24)}%`)
            .limit(10);

        const { data: competitions } = await query;
        const matchedCompetition = (competitions || []).find(row => {
            const sameNormalizedTitle = normalizeTitle(row.title) === candidate.normalized_title;
            const sameOrganizer = candidate.organizer && row.organizer &&
                row.organizer.toLowerCase() === candidate.organizer.toLowerCase();
            const sameDate = candidate.event_date && row.event_date === candidate.event_date;
            return sameNormalizedTitle && (sameOrganizer || sameDate);
        });

        if (matchedCompetition) {
            return { type: 'competition', id: matchedCompetition.id };
        }
    }

    return null;
};

const createOrUpdateCandidate = async ({ candidate, extractedJson, email, discoveryJobId }) => {
    const duplicate = await findDuplicate(candidate);

    const payload = {
        ...candidate,
        duplicate_of_competition_id: duplicate?.type === 'competition' ? duplicate.id : null,
        duplicate_of_candidate_id: duplicate?.type === 'candidate' ? duplicate.id : null,
        source_type: 'OFFICIAL_COMPETITION_EMAIL',
        source_message_id: email.gmail_message_id,
        source_sender: email.source_sender || email.sender,
        source_mailbox_user_id: email.mailbox_user_id,
        discovery_job_id: discoveryJobId,
        ai_extracted_json: extractedJson || {},
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('competition_candidates')
        .upsert(payload, { onConflict: 'source_mailbox_user_id,source_message_id' })
        .select()
        .single();

    if (error) throw error;
    return { candidate: data, duplicate };
};

const approveCandidate = async ({ candidateId, reviewedBy, updates = {} }) => {
    const { data: candidate, error } = await supabase
        .from('competition_candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

    if (error || !candidate) throw new Error('Candidate not found');
    if (candidate.status === 'APPROVED') throw new Error('Candidate is already approved');

    const finalData = { ...candidate, ...updates };
    if (!finalData.title || finalData.title.trim().length < 3) throw new Error('Title is required');

    const { data: competitionId, error: approveError } = await supabase.rpc('approve_competition_candidate', {
        p_candidate_id: candidateId,
        p_reviewed_by: reviewedBy,
        p_title: finalData.title,
        p_organizer: finalData.organizer,
        p_description: finalData.description,
        p_platform: finalData.platform || finalData.category,
        p_external_link: finalData.external_link || finalData.official_url,
        p_registration_deadline: finalData.registration_deadline,
        p_event_date: finalData.event_date,
        p_mode: finalData.mode,
        p_venue: finalData.venue,
        p_departments: updates.departments || ['All']
    });

    if (approveError) throw approveError;
    return competitionId;
};

module.exports = {
    normalizeTitle,
    normalizeUrl,
    validateCandidateData,
    findDuplicate,
    createOrUpdateCandidate,
    approveCandidate
};
