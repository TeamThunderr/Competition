const supabase = require('../config/supabaseClient');

const checkQualifiedEmail = async () => {
    const userId = '0f664e97-a595-4ba1-9ac4-bdfde76a17f2';
    const { data, error } = await supabase.from('users').select('email, full_name').eq('id', userId).single();

    if (error) console.error(error);
    else console.log(`Qualified User: ${data.full_name} | Email: ${data.email}`);
};

checkQualifiedEmail();
