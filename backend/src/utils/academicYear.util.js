// File Name: academicYear.util.js
// Purpose: Unified utility for calculating academic years based on admission year

/**
 * Returns the current academic year.
 * The academic year starts in June (month index 5).
 * e.g., In June 2026, the academic year is 2026.
 * In May 2026, the academic year is 2025.
 * @returns {number} The current academic year
 */
const getCurrentAcademicYear = () => {
    const now = new Date();
    // getMonth() is 0-indexed. 0=Jan, 4=May, 5=Jun.
    return now.getMonth() < 5 ? now.getFullYear() - 1 : now.getFullYear();
};

/**
 * Returns the academic year label (e.g., '2nd Year', '3rd Year')
 * @param {number|string} admissionYear - The year the student was admitted
 * @returns {string} The academic year label
 */
const getAcademicYearLabel = (admissionYear) => {
    if (!admissionYear) return 'Unknown';
    
    const year = parseInt(admissionYear, 10);
    const diff = getCurrentAcademicYear() - year;
    
    if (diff === 0) return '1st Year';
    if (diff === 1) return '2nd Year';
    if (diff === 2) return '3rd Year';
    if (diff === 3) return '4th Year';
    
    return 'Alumni'; 
};

/**
 * Returns the numeric difference representing the student's year.
 * diff = 1 means 2nd Year, diff = 2 means 3rd Year, etc.
 */
const getAcademicYearDiff = (admissionYear) => {
    if (!admissionYear) return -1;
    return getCurrentAcademicYear() - parseInt(admissionYear, 10);
};

module.exports = {
    getCurrentAcademicYear,
    getAcademicYearLabel,
    getAcademicYearDiff
};
