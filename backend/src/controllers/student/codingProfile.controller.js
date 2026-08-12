const supabase = require('../../config/supabaseClient');
const { sendResponse } = require('../../utils/responseHelper');
const { getMyCodingProfiles, upsertCodingProfile, syncProfileNow } = require('../../services/coding/codingProfile.service');
const { addCodingProfileSyncJob } = require('../../queues/codingSync.queue');

const getCodingProfiles = async (req, res) => {
  try {
    const profiles = await getMyCodingProfiles(req.user.id);
    return sendResponse(res, 200, profiles, 'Coding profiles fetched');
  } catch (err) {
    return sendResponse(res, 500, null, err.message);
  }
};

const updatePlatformProfile = (platform) => async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    if (!username) return sendResponse(res, 400, null, 'Username is required');
    const profile = await upsertCodingProfile({ studentId: req.user.id, platform, username });
    await addCodingProfileSyncJob({ studentCodingProfileId: profile.id, platform: profile.platform });
    return sendResponse(res, 200, profile, 'Coding profile saved and sync queued');
  } catch (err) {
    return sendResponse(res, 500, null, err.message);
  }
};

const triggerSync = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: profile, error } = await supabase.from('student_coding_profiles').select('*').eq('id', id).single();
    if (error || !profile) return sendResponse(res, 404, null, 'Coding profile not found');
    if (req.user.role === 'STUDENT' && profile.student_id !== req.user.id) return sendResponse(res, 403, null, 'Forbidden');
    const jobId = await addCodingProfileSyncJob({ studentCodingProfileId: profile.id, platform: profile.platform });
    await supabase.from('student_coding_profiles').update({
      sync_status: 'PENDING_SYNC',
      last_sync_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', profile.id);
    return sendResponse(res, 200, { queued: true, jobId }, 'Coding profile sync queued');
  } catch (err) {
    return sendResponse(res, 500, null, err.message);
  }
};

module.exports = {
  getCodingProfiles,
  updatePlatformProfile,
  triggerSync,
};
