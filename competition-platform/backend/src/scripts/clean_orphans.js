
const supabase = require('../config/supabaseClient');

const cleanOrphanedStatuses = async () => {
    try {
        console.log('Starting cleanup of orphaned statuses...');

        // 1. Fetch all statuses
        const { data: statuses, error: statusError } = await supabase
            .from('competition_status')
            .select('id, user_id, competition_id');

        if (statusError) throw statusError;

        console.log(`Checking ${statuses.length} status records for orphans...`);

        // 2. Fetch all current registrations
        const { data: regs, error: regError } = await supabase
            .from('registrations')
            .select('user_id, competition_id');

        if (regError) throw regError;

        // Create a Set of valid keys "user_id-competition_id"
        const validRegKeys = new Set(regs.map(r => `${r.user_id}-${r.competition_id}`));

        let cleanCount = 0;

        for (const status of statuses) {
            const key = `${status.user_id}-${status.competition_id}`;
            if (!validRegKeys.has(key)) {
                console.log(`Found orphan status (ID: ${status.id}) for User ${status.user_id} in Comp ${status.competition_id}`);

                const { error: delError } = await supabase
                    .from('competition_status')
                    .delete()
                    .eq('id', status.id);

                if (delError) console.error('Delete failed:', delError);
                else cleanCount++;
            }
        }

        console.log(`Cleanup Complete. Removed ${cleanCount} orphaned status records.`);

    } catch (err) {
        console.error('Cleanup failed:', err);
    }
};

cleanOrphanedStatuses();
