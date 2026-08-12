const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/role.middleware');
const supabase = require('../../config/supabaseClient');
const { sendResponse } = require('../../utils/responseHelper');

router.use(authMiddleware);
router.use(roleMiddleware(['HOD', 'ADMIN']));

router.get('/coding/overview', async (req, res) => {
  try {
    const { data, error } = await supabase.from('student_coding_profiles').select('*, users!inner(id, full_name, registration_no, section, department_id, departments(name))');
    if (error) throw error;
    return sendResponse(res, 200, data || [], 'Coding overview fetched');
  } catch (err) {
    return sendResponse(res, 500, null, err.message);
  }
});

router.get('/coding/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabase
      .from('student_coding_profiles')
      .select('*, leetcode_profile_stats(*), codechef_profile_stats(*)')
      .eq('student_id', studentId);
    if (error) throw error;
    return sendResponse(res, 200, data || [], 'Coding student details fetched');
  } catch (err) {
    return sendResponse(res, 500, null, err.message);
  }
});

router.get('/coding/students/top', async (req, res) => {
  try {
    const { platform = 'LEETCODE', limit = 10 } = req.query;
    const table = String(platform).toUpperCase() === 'CODECHEF' ? 'codechef_profile_stats' : 'leetcode_profile_stats';
    const metric = table === 'codechef_profile_stats' ? 'current_rating' : 'total_solved';
    const { data, error } = await supabase
      .from(table)
      .select('*, student_coding_profiles!inner(student_id, username, platform, users!inner(id, full_name, registration_no, section, departments(name)))')
      .order(metric, { ascending: false, nullsFirst: false })
      .limit(Number(limit) || 10);
    if (error) throw error;
    return sendResponse(res, 200, data || [], 'Top coding students fetched');
  } catch (err) {
    return sendResponse(res, 500, null, err.message);
  }
});

module.exports = router;
