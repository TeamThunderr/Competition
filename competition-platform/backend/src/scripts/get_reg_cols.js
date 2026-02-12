const supabase = require('../config/supabaseClient');

const getColumns = async () => {
    const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .limit(1);

    if (error) {
        console.error(error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Columns in registrations:", Object.keys(data[0]));
    } else {
        console.log("No data in registrations table to probe columns.");
    }
};

getColumns();
