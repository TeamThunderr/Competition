require('../config/env');
const supabase = require('../config/supabaseClient');
const fetch = require('node-fetch');

async function testApi() {
    // 1. Get a test user
    const { data: users } = await supabase.from('users').select('id, email').limit(1);
    const { data: comps } = await supabase.from('competitions').select('id, title').limit(1);

    if (!users || !users.length || !comps || !comps.length) {
        console.log("Missing users or comps");
        return;
    }

    const userId = users[0].id;
    const compId = comps[0].id;
    
    // Create a mock JWT token that authMiddleware will accept
    const jwt = require('jsonwebtoken');
    // NOTE: In development, SUPABASE_JWT_SECRET might be needed, but authMiddleware uses process.env.SUPABASE_JWT_SECRET
    // Let's check if it exists in env
    const secret = process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';
    
    const token = jwt.sign({
        sub: userId,
        email: users[0].email,
        role: 'authenticated'
    }, secret);

    console.log(`Testing API for user ${users[0].email} and comp ${compId}`);

    try {
        const response = await fetch('http://localhost:5000/api/student/toggle-temp-registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                competition_id: compId,
                is_temp_registered: true
            })
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", text);
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

testApi();
