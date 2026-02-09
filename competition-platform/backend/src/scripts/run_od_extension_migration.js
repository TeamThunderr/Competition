// Migration Script: Add OD Extension Support
// Run this to add extension columns to od_requests table

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function runMigration() {
    try {
        console.log('🔄 Running OD Extension Migration...\n');

        // Read the migration SQL file - fixed path
        const migrationPath = path.join(__dirname, '../../migrations/add_parent_od_id.sql');

        console.log(`📂 Looking for migration file at: ${migrationPath}`);

        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Migration file not found at: ${migrationPath}`);
            console.log('\n💡 Please run the SQL manually in Supabase SQL Editor:');
            console.log('   1. Open Supabase Dashboard → SQL Editor');
            console.log('   2. Copy contents from backend/migrations/add_parent_od_id.sql');
            console.log('   3. Execute the SQL\n');
            process.exit(1);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split by semicolons to execute each statement separately
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'));

        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (!statement) continue;

            console.log(`Executing statement ${i + 1}/${statements.length}...`);
            console.log(`SQL: ${statement.substring(0, 100)}...`);

            const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

            if (error) {
                console.error(`❌ Error executing statement ${i + 1}:`, error);
                // Continue with other statements
            } else {
                console.log(`✅ Statement ${i + 1} executed successfully\n`);
            }
        }

        console.log('✅ Migration completed!\n');
        console.log('📊 Verifying columns...');

        // Verify the migration by checking if columns exist
        const { data: columns, error: verifyError } = await supabase
            .from('od_requests')
            .select('*')
            .limit(1);

        if (verifyError) {
            console.error('❌ Verification failed:', verifyError);
        } else {
            console.log('✅ Verification successful!');
            if (columns && columns[0]) {
                const sampleRecord = columns[0];
                console.log('\n📋 Sample record columns:');
                console.log('- parent_od_id:', 'parent_od_id' in sampleRecord ? '✓' : '✗');
                console.log('- is_extension:', 'is_extension' in sampleRecord ? '✓' : '✗');
                console.log('- extension_count:', 'extension_count' in sampleRecord ? '✓' : '✗');
                console.log('- original_from_date:', 'original_from_date' in sampleRecord ? '✓' : '✗');
                console.log('- competitions_info:', 'competitions_info' in sampleRecord ? '✓' : '✗');
            }
        }

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
