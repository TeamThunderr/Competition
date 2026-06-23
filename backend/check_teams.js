const supabase = require('./src/config/supabaseClient');

async function checkTeamsSchema() {
    console.log('Checking teams schema...');
    const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .limit(2);

    if (error) {
        console.error('Error:', error);
    } else {
        teams.forEach((t, i) => {
            console.log(`\nTeam [${i}] Details:`);
            console.log(JSON.stringify(t, null, 2));
        });
    }
    process.exit(0);
}

checkTeamsSchema();
