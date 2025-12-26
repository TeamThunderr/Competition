import { api } from './api';

// Student APIs
export const getMyStudents = async () => {
    const response = await api.get('/api/faculty/students');
    return response.data || response;
};

// Faculty Dashboard APIs
export const getFacultyDashboardStats = async () => {
    const response = await api.get('/api/faculty/dashboard-stats');
    return response.data || response;
};

export const getRecentRegistrations = async () => {
    const response = await api.get('/api/faculty/registrations');
    return response.data || response;
};

// HOD APIs
export const getDepartmentUsers = async () => {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error("No user logged in");

        const response = await fetch(`${API_URL}/hod/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.id
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data || result;
    } catch (error) {
        console.error("UsersService Error (getDepartmentUsers):", error);
        throw error;
    }
};
