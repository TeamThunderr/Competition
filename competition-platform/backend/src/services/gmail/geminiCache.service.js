const supabase = require('../../config/supabaseClient');

const getCachedResult = async (gmailMessageId) => {
    try {
        const { data, error } = await supabase
            .from('gmail_parse_cache')
            .select('parsed_result')
            .eq('gmail_message_id', gmailMessageId)
            .single();

        if (error || !data) {
            return null;
        }
        return data.parsed_result;
    } catch (err) {
        console.error(`[GeminiCache] Error fetching cache for ${gmailMessageId}:`, err.message);
        return null;
    }
};

const setCachedResult = async (gmailMessageId, parsedResult) => {
    try {
        const { error } = await supabase
            .from('gmail_parse_cache')
            .upsert({
                gmail_message_id: gmailMessageId,
                parsed_result: parsedResult
            });

        if (error) {
            console.error(`[GeminiCache] Error setting cache for ${gmailMessageId}:`, error.message);
        }
    } catch (err) {
        console.error(`[GeminiCache] Exception setting cache for ${gmailMessageId}:`, err.message);
    }
};

module.exports = {
    getCachedResult,
    setCachedResult
};
