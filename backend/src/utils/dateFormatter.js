const formatIST = (dateString, fallback = 'N/A') => {
    if (!dateString) return fallback;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};

module.exports = { formatIST };
