import { getCurrentUser } from './authService';

const API_URL = 'http://localhost:5000/api';

export const getMyStudents = async () => {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error("No user logged in");

        const response = await fetch(`${API_URL}/faculty/students`, {
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
        return result.data || result; // Handle both wrapper {data: []} or direct []
    } catch (error) {
        console.error("UsersService Error (getMyStudents):", error);
        throw error;
    }
};

// Dashboard Stats (Faculty)
export const getFacultyDashboardStats = async () => {
    try {
        const user = getCurrentUser();
        if (!user || user.role !== 'FACULTY') {
            throw new Error('Unauthorized');
        }

        const response = await fetch(`${API_URL}/faculty/dashboard-stats`, {
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
        console.error("Error fetching dashboard stats:", error);
        throw error;
    }
};

// Recent Registrations (Faculty)
export const getRecentRegistrations = async () => {
    try {
        const user = getCurrentUser();
        if (!user || user.role !== 'FACULTY') {
            throw new Error('Unauthorized');
        }

        const response = await fetch(`${API_URL}/faculty/registrations`, {
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
        console.error("Error fetching registrations:", error);
        throw error;
    }
};

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
