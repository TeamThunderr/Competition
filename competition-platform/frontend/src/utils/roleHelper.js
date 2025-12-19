// File Name: roleHelper.js
// Purpose: Helpers for role management
// Written for beginner developers

export const ROLES = {
    STUDENT: 'student',
    FACULTY: 'faculty',
    HOD: 'hod',
    ADMIN: 'admin',
};

export const hasRole = (user, role) => {
    return user?.role === role;
};
