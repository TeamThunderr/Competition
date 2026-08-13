import { api } from './api';

const roleBase = (role = 'student') => {
  const r = String(role).toLowerCase();
  if (r === 'hod') return '/api/hod';
  if (r === 'admin') return '/api/admin';
  return '/api/student';
};

export const getMyCodingProfiles = async () => {
  const response = await api.get('/api/student/coding-profiles');
  return response.data || response;
};

export const updateLeetCodeProfile = async (username) => {
  const response = await api.put('/api/student/coding-profiles/leetcode', { username });
  return response.data || response;
};

export const updateCodeChefProfile = async (username) => {
  const response = await api.put('/api/student/coding-profiles/codechef', { username });
  return response.data || response;
};

export const syncCodingProfile = async (profileId) => {
  const response = await api.post(`/api/student/coding-profiles/${profileId}/sync`, {});
  return response.data || response;
};

export const getHodCodingOverview = async (role = 'hod') => {
  const response = await api.get(`${roleBase(role)}/coding/overview`);
  return response.data || response;
};

export const getCodingStudentDetails = async (role, studentId) => {
  const response = await api.get(`${roleBase(role)}/coding/students/${studentId}`);
  return response.data || response;
};

export const getCodingTopStudents = async (role, platform = 'LEETCODE', limit = 10) => {
  const response = await api.get(`${roleBase(role)}/coding/students/top?platform=${platform}&limit=${limit}`);
  return response.data || response;
};

export default {
  getMyCodingProfiles,
  updateLeetCodeProfile,
  updateCodeChefProfile,
  syncCodingProfile,
  getHodCodingOverview,
  getCodingStudentDetails,
  getCodingTopStudents,
};
