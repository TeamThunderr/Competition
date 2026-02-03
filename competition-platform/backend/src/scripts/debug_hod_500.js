const http = require('http');
const supabase = require('../config/supabaseClient');

async function debug500() {
    // 1. Get an HOD user
    const { data: hods, error } = await supabase
        .from('users')
        .select('id, full_name, role')
        .eq('role', 'HOD')
        .limit(1);

    if (error || !hods || hods.length === 0) {
        console.error('No HOD found to test with.');
        return;
    }

    const hod = hods[0];
    console.log(`Found HOD: ${hod.full_name} (${hod.id})`);

    const headers = {
        'x-user-id': hod.id,
        'Content-Type': 'application/json'
    };

    // 2. Test /api/hod/stats
    console.log(`Testing GET http://localhost:5000/api/hod/stats`);
    makeRequest('/api/hod/stats', headers);

    // 3. Test /api/hod/users (simulating getDepartmentUsers)
    setTimeout(() => {
        console.log(`Testing GET http://localhost:5000/api/hod/users`);
        makeRequest('/api/hod/users', headers);
    }, 1000);
}

function makeRequest(path, headers) {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: 'GET',
        headers: headers
    };

    const req = http.request(options, (res) => {
        console.log(`[${path}] Status: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`[${path}] Body:`, data.substring(0, 500)); // First 500 chars
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

debug500();
