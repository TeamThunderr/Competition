const { google } = require('googleapis');
const supabase = require('../../config/supabaseClient');
const { getOAuthClientForUser, extractCleanTextFromPayload } = require('../gmail/gmail.service');
const { parseCompetitionDiscoveryEmail } = require('../gmail/competitionDiscoveryParser.service');
const discoveryJobService = require('./competitionDiscoveryJob.service');
const candidateService = require('./competitionCandidate.service');
const { waitForGmailSlot } = require('../../utils/gmailRateGuard');

const DISCOVERY_ENABLED = String(process.env.COMPETITION_DISCOVERY_ENABLED || 'false').toLowerCase() === 'true';
const DISCOVERY_SENDER = (process.env.COMPETITION_DISCOVERY_SENDER || '').trim().toLowerCase();
const DISCOVERY_MAILBOX = (process.env.COMPETITION_DISCOVERY_MAILBOX || '').trim().toLowerCase();
const DISCOVERY_OVERLAP_MINUTES = Number(process.env.COMPETITION_DISCOVERY_OVERLAP_MINUTES || 120);

const normalizeEmailAddress = (value = '') => {
    const match = value.toString().toLowerCase().match(/<([^>]+)>/);
    const email = (match ? match[1] : value).trim().toLowerCase();
    return email.replace(/^"|"$/g, '');
};

const isDiscoveryCandidate = (emailData) => {
    const subject = (emailData.subject || '').toLowerCase();
    const body = (emailData.body_text || '').toLowerCase();
    const text = `${subject} ${body}`;
    const terms = ['competition', 'hackathon', 'contest', 'challenge', 'event', 'registration', 'deadline', 'apply', 'participate', 'workshop', 'summit'];
    return terms.some(term => text.includes(term)) || !!emailData.external_link || !!emailData.official_url;
};

const getMailboxUser = async () => {
    if (!DISCOVERY_ENABLED) {
        throw new Error('Competition discovery is disabled');
    }
    if (!DISCOVERY_MAILBOX || !DISCOVERY_SENDER) {
        throw new Error('Competition discovery mailbox/sender configuration is missing');
    }
    const { data: mailbox, error } = await supabase
        .from('users')
        .select('id, email, google_refresh_token')
        .eq('email', DISCOVERY_MAILBOX)
        .single();
    if (error || !mailbox) {
        throw new Error(`Discovery mailbox user not found: ${DISCOVERY_MAILBOX}`);
    }
    if (!mailbox.google_refresh_token) {
        throw new Error(`Discovery mailbox lacks Gmail authorization: ${DISCOVERY_MAILBOX}`);
    }
    return mailbox;
};

const getDiscoveryState = async (mailboxUserId, mailboxEmail, senderFilter) => {
    const { data, error } = await supabase
        .from('competition_discovery_state')
        .select('*')
        .eq('mailbox_user_id', mailboxUserId)
        .eq('sender_filter', senderFilter)
        .maybeSingle();
    if (error) throw error;
    if (data) return data;

    const { data: inserted, error: insertError } = await supabase
        .from('competition_discovery_state')
        .insert([{
            mailbox_user_id: mailboxUserId,
            mailbox_email: mailboxEmail,
            sender_filter: senderFilter,
            status: 'IDLE'
        }])
        .select()
        .single();
    if (insertError) throw insertError;
    return inserted;
};

const buildQuery = (lastSuccessfulSyncAt) => {
    const date = new Date(lastSuccessfulSyncAt || Date.now());
    date.setMinutes(date.getMinutes() - DISCOVERY_OVERLAP_MINUTES);
    const yyyy = date.getFullYear();
    const mm = date.getMonth() + 1;
    const dd = date.getDate();
    return `from:${DISCOVERY_SENDER} after:${yyyy}/${mm}/${dd}`;
};

const fetchDiscoveryMessages = async (mailboxUserId, query) => {
    const auth = await getOAuthClientForUser(mailboxUserId);
    const gmail = google.gmail({ version: 'v1', auth });
    let nextPageToken = null;
    const results = [];

    do {
        await waitForGmailSlot();
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: 50,
            pageToken: nextPageToken
        });
        const messages = response.data.messages || [];
        nextPageToken = response.data.nextPageToken;

        for (const msg of messages) {
            await waitForGmailSlot();
            const details = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'full'
            });
            const headers = details.data.payload.headers || [];
            const subject = headers.find(h => h.name === 'Subject')?.value || '';
            const from = headers.find(h => h.name === 'From')?.value || '';
            const to = headers.find(h => h.name === 'To')?.value || '';
            const sender = normalizeEmailAddress(from);
            if (sender !== DISCOVERY_SENDER) {
                continue;
            }

            results.push({
                gmail_message_id: msg.id,
                internal_date: details.data.internalDate ? new Date(Number(details.data.internalDate)).toISOString() : null,
                subject,
                sender,
                recipient: to,
                snippet: details.data.snippet || '',
                body_text: extractCleanTextFromPayload(details.data.payload),
                raw: details.data
            });
        }
    } while (nextPageToken);

    return results;
};

const bufferDiscoveryEmail = async (mailboxUserId, email) => {
    const { error } = await supabase
        .from('email_ingestion_buffer')
        .upsert([{
            mailbox_user_id: mailboxUserId,
            source_type: 'COMPETITION_DISCOVERY',
            gmail_message_id: email.gmail_message_id,
            sender: email.sender,
            source_sender: email.sender,
            source_recipient: email.recipient,
            gmail_internal_date: email.internal_date,
            subject: email.subject,
            body_text: email.body_text.substring(0, 5000),
            status: 'pending'
        }], { onConflict: 'mailbox_user_id,gmail_message_id,source_type' });
    if (error) throw error;
};

const processDiscoveryJob = async ({ discoveryJobId, requestedBy, heartbeat, complete, updateJob }) => {
    const syncJob = await discoveryJobService.getDiscoveryJob(discoveryJobId);
    const mailbox = await getMailboxUser();
    const state = await getDiscoveryState(mailbox.id, mailbox.email, DISCOVERY_SENDER);
    const query = buildQuery(state.last_successful_sync_at);

    await discoveryJobService.markProcessing(discoveryJobId);

    const messages = await fetchDiscoveryMessages(mailbox.id, query);
    await heartbeat({ messages_found: messages.length, messages_processed: 0, candidates_created: 0, duplicates_found: 0, error_count: 0 });

    let processed = 0;
    let candidatesCreated = 0;
    let duplicatesFound = 0;
    let errors = 0;

    for (const message of messages) {
        try {
            await bufferDiscoveryEmail(mailbox.id, message);
            if (!isDiscoveryCandidate(message)) {
                processed++;
                continue;
            }

            const extracted = await parseCompetitionDiscoveryEmail(message);
            const validation = candidateService.validateCandidateData(extracted || {});
            if (!validation.valid) {
                errors++;
                processed++;
                continue;
            }

            const { candidate, duplicate } = await candidateService.createOrUpdateCandidate({
                candidate: validation.candidate,
                extractedJson: extracted,
                email: {
                    gmail_message_id: message.gmail_message_id,
                    source_sender: message.sender,
                    mailbox_user_id: mailbox.id
                },
                discoveryJobId
            });

            if (duplicate) {
                duplicatesFound++;
            } else {
                candidatesCreated++;
            }

            processed++;
            await heartbeat({
                messages_found: messages.length,
                messages_processed: processed,
                candidates_created: candidatesCreated,
                duplicates_found: duplicatesFound,
                error_count: errors
            });
        } catch (err) {
            errors++;
            processed++;
            if (err.type === 'QUOTA_EXCEEDED') {
                await updateJob({
                    status: 'PAUSED_RATE_LIMIT',
                    error_message: err.message,
                    error_count: errors
                });
                throw err;
            }
        }
    }

    const finalStatus = errors > 0
        ? (candidatesCreated > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED')
        : 'COMPLETED';

    await discoveryJobService.completeDiscoveryJob(discoveryJobId, finalStatus, {
        messages_found: messages.length,
        messages_processed: processed,
        candidates_created: candidatesCreated,
        duplicates_found: duplicatesFound,
        error_count: errors,
        error_message: errors > 0 ? `Discovery completed with ${errors} errors` : null
    });

    await supabase
        .from('competition_discovery_state')
        .update({
            last_successful_sync_at: new Date().toISOString(),
            last_gmail_message_internal_date: messages.reduce((latest, curr) => {
                if (!curr.internal_date) return latest;
                if (!latest) return curr.internal_date;
                return new Date(curr.internal_date) > new Date(latest) ? curr.internal_date : latest;
            }, state.last_gmail_message_internal_date),
            status: 'COMPLETED',
            error_message: errors > 0 ? `Completed with ${errors} errors` : null,
            updated_at: new Date().toISOString()
        })
        .eq('id', state.id);

    return { messagesFound: messages.length, processed, candidatesCreated, duplicatesFound, errors };
};

module.exports = {
    processDiscoveryJob,
    getMailboxUser,
    getDiscoveryState,
    buildQuery,
    fetchDiscoveryMessages,
    bufferDiscoveryEmail,
    normalizeEmailAddress,
    isDiscoveryCandidate
};
