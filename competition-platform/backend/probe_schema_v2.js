const supabase = require('./src/config/supabaseClient');
const fs = require('fs');

const probeSchema = async () => {
    const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error probing schema:", error);
        return;
    }

    if (data && data.length > 0) {
        fs.writeFileSync('reg_columns.json', JSON.stringify(Object.keys(data[0]), null, 2));
    }
};

probeSchema();
