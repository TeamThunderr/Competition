const http = require('http');
const supabase = require('../config/supabaseClient');

async function debugFaculty500() {
    const { data: faculty, error } = await supabase
        .from('users')
        .select('id, full_name, role, email')
        .eq('email', 'faculty1@citchennai.net')
        .single();

    if (error || !faculty) {
        console.error('Faculty user faculty1@citchennai.net not found. Listing all faculties:');
        const { data: allFaculties } = await supabase.from('users').select('email, full_name').eq('role', 'FACULTY');
        console.log(allFaculties);
        return;
    }

    console.log(`Found Faculty: ${faculty.full_name} (${faculty.id})`);

    const headers = {
        'x-user-id': faculty.id,
        'Content-Type': 'application/json'
    };

    // 2. Test /api/faculty/dashboard-stats
    console.log(`Testing GET http://127.0.0.1:5001/api/faculty/dashboard-stats`);
    makeRequest('/api/faculty/dashboard-stats', headers);
}

function makeRequest(path, headers) {
    const options = {
        hostname: '127.0.0.1',
        port: 5001,
        path: path,
        method: 'GET',
        headers: headers
    };

    const req = http.request(options, (res) => {
        console.log(`[${path}] Status: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`[${path}] Body:`, data);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

debugFaculty500();
