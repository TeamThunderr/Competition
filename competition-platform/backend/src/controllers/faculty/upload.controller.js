const xlsx = require('xlsx');
const supabase = require('../../config/supabaseClient');

const bulkUploadStudents = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { department_id } = req.user;
        const buffer = req.file.buffer;
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);

        if (!jsonData || jsonData.length === 0) {
            return res.status(400).json({ error: 'Empty Excel file' });
        }

        // Validate Key Columns (Case Insensitive Check)
        const firstRow = jsonData[0];
        const keys = Object.keys(firstRow).map(k => k.trim().toLowerCase());
        const required = ['register no', 'name', 'email'];
        const missing = required.filter(k => !keys.some(key => key.includes(k)));

        if (missing.length > 0) {
            return res.status(400).json({
                error: `Missing required columns: ${missing.join(', ')}. Found: ${keys.join(', ')}`
            });
        }

        const studentsToUpsert = [];
        const errors = [];

        for (const row of jsonData) {
            // Flexible Key Access
            const getVal = (keyPart) => {
                const key = Object.keys(row).find(k => k.toLowerCase().includes(keyPart));
                return key ? row[key] : null;
            };

            const regNo = getVal('register no') || getVal('roll no');
            const name = getVal('name');
            const email = getVal('email');
            const section = getVal('section') || 'N/A';
            const gender = getVal('gender') || 'N/A';
            const phone = getVal('mobile') || getVal('phone') || '';

            if (!regNo || !name || !email) {
                errors.push(`Row missing fields: ${JSON.stringify(row)}`);
                continue;
            }

            studentsToUpsert.push({
                registration_no: String(regNo).trim(),
                full_name: String(name).trim(),
                email: String(email).trim().toLowerCase(),
                section: String(section).trim().toUpperCase(),
                gender: String(gender).trim(),
                phone_number: String(phone).trim(),
                department_id: department_id,
                role: 'STUDENT',
                password: 'Welcome@123', // Default Password
                is_active: true
            });
        }

        if (studentsToUpsert.length === 0) {
            return res.status(400).json({ error: 'No valid student data found to processing.' });
        }

        // Upsert into Supabase (Batch)
        // Note: Supabase upsert requires unique constraint. Assuming email or registration_no.
        // We will try upserting. Conflict on email is safer.
        const { data, error } = await supabase
            .from('users')
            .upsert(studentsToUpsert, { onConflict: 'email', ignoreDuplicates: false });

        if (error) {
            console.error('Bulk Upload DB Error:', error);
            throw error;
        }

        res.status(200).json({
            message: `Processed ${jsonData.length} rows. Successfully upserted ${studentsToUpsert.length} students.`,
            errors: errors.length > 0 ? errors : null
        });

    } catch (err) {
        console.error('Bulk Upload Error:', err);
        res.status(500).json({ error: 'Internal Server Error during upload processing' });
    }
};

module.exports = { bulkUploadStudents };
