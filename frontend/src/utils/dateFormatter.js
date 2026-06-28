export const formatDate = (dateString, fallback = 'N/A') => {
    if (!dateString) return fallback;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
        // If it's a string and fails parsing, it might already be formatted from the backend
        return typeof dateString === 'string' ? dateString : fallback;
    }
    return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
};

export const formatDateTime = (dateString, fallback = 'N/A') => {
    if (!dateString) return fallback;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
        // If it's a string and fails parsing, it might already be formatted from the backend
        return typeof dateString === 'string' ? dateString : fallback;
    }
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};
