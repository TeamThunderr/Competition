// File Name: approval.routes.js
// Purpose: Routes for approval workflow
// Written for beginner developers

const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approval.controller');
const checkRole = require('../middleware/role.middleware');

// Student requests permission
router.post('/request', checkRole('STUDENT'), approvalController.requestApproval);

// Faculty approves/rejects
router.post('/faculty', checkRole('FACULTY'), approvalController.updateFacultyStatus);

// HOD approves/rejects
router.post('/hod', checkRole('HOD'), approvalController.updateHodStatus);

// Get list of approvals (Faculty and HOD)
router.get('/list', checkRole(['FACULTY', 'HOD']), approvalController.getDepartmentApprovals);

module.exports = router;
