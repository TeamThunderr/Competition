
const dotenv = require('dotenv');
dotenv.config();
const competitionController = require('../controllers/core/competition.controller');

const supabase = require('../config/supabaseClient');

// Mock req, res
const req = {};
const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status: function (code) {
        this.statusCode = code;
        return this;
    },
    json: function (data) {
        this.body = data;
        return this;
    },
    send: function (data) { // responseHelper uses send
        this.body = data;
        return this;
    }
};

async function checkCompetitions() {
    console.log('--- Checking getAllCompetitions Output ---');
    await competitionController.getAllCompetitions(req, res);

    // Check the first few items
    if (res.body && res.body.data) {
        const comps = res.body.data.slice(0, 3);
        comps.forEach(c => {
            console.log(`Comp: ${c.title} (${c.id})`);
            console.log('  Registrations Raw:', JSON.stringify(c.registrations));
            // Check if stats are present?
            console.log('  Keys:', Object.keys(c));
        });
    } else {
        console.log('Response body structure:', Object.keys(res.body));
        const comps = Array.isArray(res.body) ? res.body : (res.body.data || []);
        comps.slice(0, 3).forEach(c => {
            console.log(`Comp: ${c.title}`);
            console.log('  Registrations:', JSON.stringify(c.registrations));
        });
    }
}

checkCompetitions();
