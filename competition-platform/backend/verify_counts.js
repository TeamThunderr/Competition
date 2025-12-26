const fs = require('fs');

async function getFetch() {
    if (typeof fetch !== 'undefined') return fetch;
    try {
        const mod = await import('node-fetch');
        return mod.default;
    } catch (e) {
        throw new Error('Fetch not available');
    }
}

async function verifyCounts() {
    try {
        const myFetch = await getFetch();
        const url = 'http://localhost:5001/api/competitions';

        const response = await myFetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();

        let log = `Fetched ${data.length} competitions.\n`;
        let success = true;

        if (data.length > 0) {
            const firstItem = data[0];
            // Update check to match actual Supabase response structure: registrations: [{ count: N }]
            const hasCount = firstItem.registrations &&
                Array.isArray(firstItem.registrations) &&
                firstItem.registrations.length > 0 &&
                typeof firstItem.registrations[0].count === 'number';

            log += `Sample Item Title: ${firstItem.title}\n`;

            if (hasCount) {
                log += `✅ Registration count found: ${firstItem.registrations[0].count}\n`;
            } else {
                if (firstItem.registrations && Array.isArray(firstItem.registrations) && firstItem.registrations.length === 0) {
                    // If array is empty, it might mean 0 registrations or left join weirdness, 
                    // but typically Supabase returns [{count: 0}] for count queries unless grouped differently.
                    // However, if the count is strictly 0, sometimes it might be just an empty array depending on exact query.
                    // But in our debug, we saw [{count: 0}], so we stick to that expectation.
                    log += `⚠️ 'registrations' is an empty array. Might be 0, but expected [{count: 0}]. Structure: ${JSON.stringify(firstItem.registrations)}\n`;
                } else if (firstItem.registrations) {
                    log += `⚠️ 'registrations' field exists but structure unexpected: ${JSON.stringify(firstItem.registrations)}\n`;
                } else {
                    log += `❌ 'registrations' field MISSING.\n`;
                    success = false;
                }
            }
        } else {
            log += "⚠️ No competitions to verify against.\n";
        }

        fs.writeFileSync('verify_count_result.txt', log);
        console.log("Verification finished. Check verify_count_result.txt");

    } catch (err) {
        fs.writeFileSync('verify_count_result.txt', `Verification failed: ${err.message}`);
        console.error("Verification failed");
    }
}

verifyCounts();
