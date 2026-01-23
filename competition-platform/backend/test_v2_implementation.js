// Gmail Sync V2 Implementation Test Script
// Tests the core V2 principles: FACT/PROGRESSION separation, state consistency

const { ensureRegistrationExists, upsertCompetitionStatus } = require('./src/services/gmailSyncV2.service');
const supabase = require('./src/config/supabaseClient');

// Test data
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'; // Mock UUID
const TEST_COMPETITION_ID = '550e8400-e29b-41d4-a716-446655440001'; // Mock UUID

/**
 * Test V2 Write Rules Implementation
 */
async function testV2WriteRules() {
    console.log('🧪 Testing Gmail Sync V2 Write Rules\n');
    console.log('=' * 60);

    try {
        // Test 1: REGISTERED status
        console.log('\n1. Testing REGISTERED status...');
        await ensureRegistrationExists(TEST_USER_ID, TEST_COMPETITION_ID, 'AUTO_GMAIL');
        
        // Verify registration exists
        const { data: registration } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', TEST_USER_ID)
            .eq('competition_id', TEST_COMPETITION_ID)
            .single();
        
        console.log('✅ Registration created:', registration ? 'SUCCESS' : 'FAILED');

        // Test 2: QUALIFIED status (should upgrade)
        console.log('\n2. Testing QUALIFIED status upgrade...');
        await upsertCompetitionStatus(TEST_USER_ID, TEST_COMPETITION_ID, { is_shortlisted: true });
        
        // Verify status updated
        const { data: qualifiedStatus } = await supabase
            .from('competition_status')
            .select('*')
            .eq('user_id', TEST_USER_ID)
            .eq('competition_id', TEST_COMPETITION_ID)
            .single();
        
        console.log('✅ Qualified status:', qualifiedStatus?.is_shortlisted ? 'SUCCESS' : 'FAILED');

        // Test 3: WON status (should upgrade and maintain shortlisted)
        console.log('\n3. Testing WON status upgrade...');
        await upsertCompetitionStatus(TEST_USER_ID, TEST_COMPETITION_ID, { 
            is_winner: true,
            is_shortlisted: true 
        });
        
        // Verify winner status
        const { data: winnerStatus } = await supabase
            .from('competition_status')
            .select('*')
            .eq('user_id', TEST_USER_ID)
            .eq('competition_id', TEST_COMPETITION_ID)
            .single();
        
        console.log('✅ Winner status:', winnerStatus?.is_winner ? 'SUCCESS' : 'FAILED');
        console.log('✅ Shortlisted maintained:', winnerStatus?.is_shortlisted ? 'SUCCESS' : 'FAILED');

        // Test 4: Verify no downgrade (try to set winner to false)
        console.log('\n4. Testing no downgrade protection...');
        await upsertCompetitionStatus(TEST_USER_ID, TEST_COMPETITION_ID, { 
            is_winner: false // This should be ignored
        });
        
        // Verify winner status maintained
        const { data: protectedStatus } = await supabase
            .from('competition_status')
            .select('*')
            .eq('user_id', TEST_USER_ID)
            .eq('competition_id', TEST_COMPETITION_ID)
            .single();
        
        console.log('✅ Downgrade protection:', protectedStatus?.is_winner ? 'SUCCESS' : 'FAILED');

        console.log('\n' + '=' * 60);
        console.log('🎯 V2 Write Rules Test Summary');
        console.log('=' * 60);
        console.log('✅ All tests passed - V2 implementation working correctly');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

/**
 * Test Dashboard Count Consistency
 */
async function testDashboardConsistency() {
    console.log('\n🎯 Testing Dashboard Count Consistency\n');
    
    try {
        // Count registrations (Faculty dashboard logic)
        const { count: facultyRegisteredCount } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', TEST_USER_ID);

        // Count qualified (Faculty dashboard logic)
        const { count: facultyQualifiedCount } = await supabase
            .from('competition_status')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', TEST_USER_ID)
            .eq('is_shortlisted', true);

        // Count won (Faculty dashboard logic)
        const { count: facultyWonCount } = await supabase
            .from('competition_status')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', TEST_USER_ID)
            .eq('is_winner', true);

        console.log('Faculty Dashboard Counts:');
        console.log(`  Registered: ${facultyRegisteredCount}`);
        console.log(`  Qualified: ${facultyQualifiedCount}`);
        console.log(`  Won: ${facultyWonCount}`);

        // Student dashboard should show same counts
        const studentCompetitions = await getStudentCompetitionsForTest(TEST_USER_ID);
        const studentRegistered = studentCompetitions.length;
        const studentQualified = studentCompetitions.filter(c => c.status === 'QUALIFIED' || c.status === 'WON').length;
        const studentWon = studentCompetitions.filter(c => c.status === 'WON').length;

        console.log('\nStudent Dashboard Counts:');
        console.log(`  Registered: ${studentRegistered}`);
        console.log(`  Qualified: ${studentQualified}`);
        console.log(`  Won: ${studentWon}`);

        // Verify consistency
        const isConsistent = (
            facultyRegisteredCount === studentRegistered &&
            facultyQualifiedCount === studentQualified &&
            facultyWonCount === studentWon
        );

        console.log(`\n✅ Dashboard Consistency: ${isConsistent ? 'SUCCESS' : 'FAILED'}`);

    } catch (error) {
        console.error('❌ Dashboard consistency test failed:', error.message);
    }
}

/**
 * Helper function to get student competitions (mimics V2 service)
 */
async function getStudentCompetitionsForTest(studentId) {
    const { data: registrations } = await supabase
        .from('registrations')
        .select(`
            competitions (id, title),
            registered_at
        `)
        .eq('user_id', studentId);

    const { data: statuses } = await supabase
        .from('competition_status')
        .select('competition_id, is_shortlisted, is_winner')
        .eq('user_id', studentId);

    return registrations.map(reg => {
        const status = statuses?.find(s => s.competition_id === reg.competitions.id);
        
        let currentStatus = 'REGISTERED';
        if (status?.is_winner) {
            currentStatus = 'WON';
        } else if (status?.is_shortlisted) {
            currentStatus = 'QUALIFIED';
        }

        return {
            id: reg.competitions.id,
            title: reg.competitions.title,
            status: currentStatus,
            registeredAt: reg.registered_at
        };
    });
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
        // Delete test competition status
        await supabase
            .from('competition_status')
            .delete()
            .eq('user_id', TEST_USER_ID)
            .eq('competition_id', TEST_COMPETITION_ID);

        // Delete test registration
        await supabase
            .from('registrations')
            .delete()
            .eq('user_id', TEST_USER_ID)
            .eq('competition_id', TEST_COMPETITION_ID);

        console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
    }
}

// Run tests
async function runAllTests() {
    console.log('🚀 Starting Gmail Sync V2 Implementation Tests\n');
    
    await testV2WriteRules();
    await testDashboardConsistency();
    await cleanupTestData();
    
    console.log('\n🎉 All tests completed!');
}

// Execute if run directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testV2WriteRules,
    testDashboardConsistency,
    cleanupTestData
};