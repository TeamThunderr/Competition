
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'b5d84c6e-8278-4504-8902-8328c6145326', // Random UUID
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
};

const req = http.request(options, res => {
    console.log(`StatusCode: ${res.statusCode}`);
    let data = '';

    res.on('data', chunk => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', data);
    });
});

req.on('error', error => {
    console.error('Error:', error);
});

req.end();
