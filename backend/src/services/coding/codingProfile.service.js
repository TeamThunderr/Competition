const supabase = require('../../config/supabaseClient');
const LeetCodeProvider = require('./leetcode.provider');
const CodeChefProvider = require('./codechef.provider');

const providers = {
  LEETCODE: new LeetCodeProvider(),
  CODECHEF: new CodeChefProvider(),
};

const getProvider = (platform) => providers[String(platform || '').toUpperCase()];

const getMyCodingProfiles = async (studentId) => {
  const { data, error } = await supabase.from('student_coding_profiles').select('*').eq('student_id', studentId).order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

const upsertCodingProfile = async ({ studentId, platform, username }) => {
  const provider = getProvider(platform);
  if (!provider) throw new Error('Unsupported coding platform');
  const validation = await provider.getPublicProfile(username);
  const { data, error } = await supabase.rpc('create_or_update_coding_profile', {
    p_student_id: studentId,
    p_platform: platform,
    p_username: username,
    p_profile_url: validation.profileUrl || null,
    p_verified_publicly: !!validation.exists,
    p_source_type: validation.sourceType || 'PUBLIC_PROFILE'
  });
  if (error) throw error;
  return data;
};

const queueCodingProfileSync = async ({ studentCodingProfileId, platform }) => {
  const { error } = await supabase.from('coding_sync_jobs').insert([{ student_coding_profile_id: studentCodingProfileId, platform, status: 'QUEUED' }]);
  if (error && !String(error.message || '').includes('relation "coding_sync_jobs"')) throw error;
  return { queued: true };
};

const syncProfileNow = async (studentCodingProfile) => {
  const provider = getProvider(studentCodingProfile.platform);
  if (!provider) throw new Error('Unsupported coding platform');
  const stats = await provider.getCurrentStats(studentCodingProfile.username);
  if (!stats.exists && stats.status !== 'VALID') {
    await supabase.from('student_coding_profiles').update({
      sync_status: stats.status || 'ERROR',
      last_sync_started_at: new Date().toISOString(),
      last_sync_error: `Profile ${stats.status || 'ERROR'}`,
      updated_at: new Date().toISOString()
    }).eq('id', studentCodingProfile.id);
    return stats;
  }

  await supabase.from('student_coding_profiles').update({
    profile_url: stats.profileUrl || studentCodingProfile.profile_url,
    sync_status: 'VALID',
    verified_publicly: true,
    last_synced_at: new Date().toISOString(),
    last_sync_started_at: new Date().toISOString(),
    last_sync_error: null,
    updated_at: new Date().toISOString()
  }).eq('id', studentCodingProfile.id);

  const snapshot = {
    student_coding_profile_id: studentCodingProfile.id,
    platform: studentCodingProfile.platform,
    snapshot_date: new Date().toISOString().slice(0, 10),
    username: studentCodingProfile.username,
    total_solved: stats.totalSolved ?? null,
    easy_solved: stats.easySolved ?? null,
    medium_solved: stats.mediumSolved ?? null,
    hard_solved: stats.hardSolved ?? null,
    rating: stats.contestRating ?? stats.currentRating ?? null,
    highest_rating: stats.highestRating ?? null,
    stars: stats.stars ?? null,
    global_rank: stats.globalRank ?? null,
    country_rank: stats.countryRank ?? null,
    contest_count: stats.contestParticipationCount ?? null,
    badge_count: stats.badgeCount ?? null,
    source_type: stats.sourceType || 'PUBLIC_PROFILE'
  };

  await supabase.from('coding_stats_snapshots').upsert([snapshot], { onConflict: 'student_coding_profile_id,snapshot_date' });

  if (studentCodingProfile.platform === 'LEETCODE') {
    await supabase.rpc('store_leetcode_stats', {
      p_student_coding_profile_id: studentCodingProfile.id,
      p_username: studentCodingProfile.username,
      p_profile_url: stats.profileUrl || studentCodingProfile.profile_url,
      p_total_solved: stats.totalSolved ?? null,
      p_easy_solved: stats.easySolved ?? null,
      p_medium_solved: stats.mediumSolved ?? null,
      p_hard_solved: stats.hardSolved ?? null,
      p_ranking: stats.ranking ?? null,
      p_reputation: stats.reputation ?? null,
      p_contest_rating: stats.contestRating ?? null,
      p_contest_participation_count: stats.contestParticipationCount ?? null,
      p_badge_count: stats.badgeCount ?? null,
      p_activity_summary: stats.activitySummary || {},
      p_source_type: stats.sourceType || 'PUBLIC_PROFILE'
    });
  } else {
    await supabase.rpc('store_codechef_stats', {
      p_student_coding_profile_id: studentCodingProfile.id,
      p_username: studentCodingProfile.username,
      p_profile_url: stats.profileUrl || studentCodingProfile.profile_url,
      p_current_rating: stats.currentRating ?? null,
      p_highest_rating: stats.highestRating ?? null,
      p_stars: stats.stars ?? null,
      p_global_rank: stats.globalRank ?? null,
      p_country_rank: stats.countryRank ?? null,
      p_institution_rank: stats.institutionRank ?? null,
      p_contest_participation_count: stats.contestParticipationCount ?? null,
      p_total_solved: stats.totalSolved ?? null,
      p_badge_count: stats.badgeCount ?? null,
      p_activity_summary: stats.activitySummary || {},
      p_source_type: stats.sourceType || 'PUBLIC_PROFILE'
    });
  }

  return stats;
};

module.exports = {
  getProvider,
  getMyCodingProfiles,
  upsertCodingProfile,
  syncProfileNow,
};
