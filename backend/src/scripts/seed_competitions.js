const supabase = require('../config/supabaseClient');

const seedCompetitions = async () => {
    console.log('🌱 Starting Competition Seeding...');

    const competitionsToSeed = [
        {
            title: 'Test Competition 1',
            description: 'This is a test competition for seeding purposes.',
            platform: 'Hackerrank',
            registration_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
            event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // +10 days
            team_allowed: false,
            min_team_size: 1,
            max_team_size: 1,
            mode: 'Online',
            organizer: 'Test Organizer'
        },
        {
            title: 'Test Competition 2',
            description: 'Another test competition for team participation.',
            platform: 'CodeChef',
            registration_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // +14 days
            event_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // +20 days
            team_allowed: true,
            min_team_size: 2,
            max_team_size: 4,
            mode: 'Offline',
            organizer: 'Dept of CSE'
        },
        {
            title: 'Test Competition 3',
            description: 'A third test competition.',
            platform: 'LeetCode',
            registration_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // +2 days
            event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // +5 days
            team_allowed: false,
            min_team_size: 1,
            max_team_size: 1,
            mode: 'Online',
            organizer: 'Coding Club'
        },
        {
            title: 'Test Competition 4',
            description: 'Test competition 4.',
            platform: 'Unstop',
            registration_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
            event_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(), // +35 days
            team_allowed: true,
            min_team_size: 3,
            max_team_size: 5,
            mode: 'Hybrid',
            organizer: 'Innovation Cell'
        },
        {
            title: 'Test Competition 5',
            description: 'Test competition 5.',
            platform: 'Devfolio',
            registration_deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // +60 days
            event_date: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString(), // +65 days
            team_allowed: true,
            min_team_size: 2,
            max_team_size: 4,
            mode: 'Online',
            organizer: 'Test Organizer'
        }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const comp of competitionsToSeed) {
        // Check if exists
        const { data: existing, error: fetchError } = await supabase
            .from('competitions')
            .select('id')
            .eq('title', comp.title)
            .maybeSingle();

        if (fetchError) {
            console.error(`❌ Error checking ${comp.title}:`, fetchError.message);
            continue;
        }

        if (existing) {
            console.log(`⏩ '${comp.title}' already exists. Skipping.`);
            skippedCount++;
            continue;
        }

        // Insert
        const { error: insertError } = await supabase
            .from('competitions')
            .insert([comp]);

        if (insertError) {
            console.error(`❌ Error inserting ${comp.title}:`, insertError.message);
        } else {
            console.log(`✅ Created '${comp.title}'`);
            createdCount++;
        }
    }

    console.log(`\n🎉 Seeding Complete! Created: ${createdCount}, Skipped: ${skippedCount}`);

    // Safety exit
    process.exit(0);
};

seedCompetitions();
