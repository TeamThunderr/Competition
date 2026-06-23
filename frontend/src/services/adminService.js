import { api } from './api';

// =====================================================
// Admin Service - All Admin-specific API calls
// =====================================================

// Student Search & Management
export const getStudents = async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    try {
        const data = await api.get(`/api/admin/students?${queryParams}`);
        return data.data || data;
    } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
    }
};

export const getStudentById = async (id) => {
    try {
        const data = await api.get(`/api/admin/student/${id}`);
        return data.data || data;
    } catch (error) {
        console.error("Error fetching student details:", error);
        throw error;
    }
};

export default {
    getStudents,
    getStudentById
};
