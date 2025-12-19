// File Name: auth.controller.js
// Purpose: Handle login/signup requests
// Written for beginner developers

const { sendResponse } = require('../utils/responseHelper');

const login = async (req, res) => {
    // TODO: Implement login logic
    sendResponse(res, 200, { token: 'dummy-token' }, 'Login successful');
};

const signup = async (req, res) => {
    // TODO: Implement signup logic
    sendResponse(res, 201, { user: req.body }, 'Signup successful');
};

module.exports = { login, signup };
