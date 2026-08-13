import { api } from './api';

const basePathForRole = (role = '') => {
    if (role === 'ADMIN') return '/api/admin';
    return '/api/hod';
};

export const getCandidates = async (role, status = 'PENDING_REVIEW') => {
    const response = await api.get(`${basePathForRole(role)}/competition-candidates?status=${status}&t=${Date.now()}`);
    return response.data || response;
};

export const getCandidate = async (role, id) => {
    const response = await api.get(`${basePathForRole(role)}/competition-candidates/${id}?t=${Date.now()}`);
    return response.data || response;
};

export const getPendingCount = async (role) => {
    const data = await getCandidates(role, 'PENDING_REVIEW');
    return Array.isArray(data) ? data.length : (data?.length || 0);
};

export const startDiscovery = async (role) => {
    const response = await api.post(`${basePathForRole(role)}/competition-discovery/sync`, {});
    return response.data || response;
};

export const updateCandidate = async (role, id, payload) => {
    const response = await api.patch(`${basePathForRole(role)}/competition-candidates/${id}`, payload);
    return response.data || response;
};

export const approveCandidate = async (role, id, payload = {}) => {
    const response = await api.post(`${basePathForRole(role)}/competition-candidates/${id}/approve`, payload);
    return response.data || response;
};

export const rejectCandidate = async (role, id, rejection_reason = '') => {
    const response = await api.post(`${basePathForRole(role)}/competition-candidates/${id}/reject`, { rejection_reason });
    return response.data || response;
};

export const getDiscoveryStatus = async (role) => {
    const response = await api.get(`${basePathForRole(role)}/competition-discovery/status?t=${Date.now()}`);
    return response.data || response;
};

export default {
    getCandidates,
    getCandidate,
    getPendingCount,
    startDiscovery,
    updateCandidate,
    approveCandidate,
    rejectCandidate,
    getDiscoveryStatus
};
