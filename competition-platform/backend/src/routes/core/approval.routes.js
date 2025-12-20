// File Name: approval.routes.js
// Purpose: Routes for approval workflow
// Written for beginner developers

const express = require('express');
const router = express.Router();
const approvalController = require('../../controllers/approval.controller');
// const checkRole = require('../middleware/role.middleware'); // Removed for public access

// Student requests permission
router.post('/request', approvalController.requestApproval);

// Faculty approves/rejects
router.post('/faculty', approvalController.updateFacultyStatus);

// HOD approves/rejects
router.post('/hod', approvalController.updateHodStatus);

// Get list of approvals (Filtered by department of the user in x-user-id)
router.get('/list', approvalController.getDepartmentApprovals);

module.exports = router;
