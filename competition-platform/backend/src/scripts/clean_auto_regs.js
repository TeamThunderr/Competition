
const supabase = require('../config/supabaseClient');

const cleanInvalidRegistrations = async () => {
    try {
        console.log('Starting cleanup of invalid registrations...');

        // 1. Fetch all 'Qualified' statuses
        const { data: statuses, error: statusError } = await supabase
            .from('competition_status')
            .select('*, competitions(title)')
            .eq('is_shortlisted', true);

        if (statusError) throw statusError;

        console.log(`Found ${statuses.length} qualified records.`);

        // 2. Define the list of "Valid" competitions (or logic to detect invalid ones)
        // Since the user said they deleted "detected hackathon", let's assume anything 
        // that was AUTO_GMAIL and is NOT "verified" by a human might be suspect if we want to be aggressive.

        // HOWEVER, the user specifically mentioned false positives. 
        // Let's delete ALL 'Qualified' statuses for now so they can re-sync with the FIXED logic.
        // This is the safest way to ensure "ghost" records are gone.

        // WARNING: This deletes legitimate data if they manually entered it.
        // BETTER APPROACH: Delete only those where source is AUTO_GMAIL (linked via registrations).

        // Let's fetch registrations that are AUTO_GMAIL
        const { data: autoRegs } = await supabase
            .from('registrations')
            .select('user_id, competition_id')
            .eq('source', 'AUTO_GMAIL');

        if (!autoRegs || autoRegs.length === 0) {
            console.log('No auto-registrations found to clean.');
            return;
        }

        console.log(`Found ${autoRegs.length} auto-generated registrations.`);

        // Delete from competition_status matching these IDs
        for (const reg of autoRegs) {
            const { error: delError } = await supabase
                .from('competition_status')
                .delete()
                .match({ user_id: reg.user_id, competition_id: reg.competition_id });

            if (delError) console.error(`Failed to delete status for ${reg.user_id}`, delError);
        }

        // Delete from registrations
        const { error: regDelError } = await supabase
            .from('registrations')
            .delete()
            .eq('source', 'AUTO_GMAIL');

        if (regDelError) throw regDelError;

        console.log('Successfully removed all AUTO_GMAIL registrations and their statuses.');
        console.log('Please re-run the Gmail Sync check to populate valid matches only.');

    } catch (err) {
        console.error('Cleanup failed:', err);
    }
};

cleanInvalidRegistrations();
