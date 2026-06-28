export const formatDate = (dateString, fallback = 'N/A') => {
    if (!dateString) return fallback;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
};

export const formatDateTime = (dateString, fallback = 'N/A') => {
    if (!dateString) return fallback;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};
