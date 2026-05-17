const multer = require('multer');

// Configure storage
const storage = multer.memoryStorage();

// Create upload middleware
const excelUpload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allowed mimetypes for Excel/CSV
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
            'application/csv', // .csv alternate
            'text/plain' // sometimes csv comes as text/plain
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel (.xlsx, .xls) or CSV files are allowed!'), false);
        }
    }
});

module.exports = excelUpload;
