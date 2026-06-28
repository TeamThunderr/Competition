import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        '❌ Supabase ENV missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Normal login — shows account picker, no consent screen
// Google will only return a refresh_token if user grants consent.
export const signInWithGoogle = async () => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/login`,
                scopes: 'https://www.googleapis.com/auth/gmail.readonly',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                    include_granted_scopes: 'true'
                }
            }
        });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Google Sign In Error:', error);
        throw error;
    }
};

// Force-consent login — used only when user has no refresh_token stored.
// prompt=consent guarantees Google returns a fresh refresh_token.
export const signInWithGoogleConsent = async (emailHint = '') => {
    try {
        const queryParams = {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true'
        };
        
        if (emailHint) {
            queryParams.login_hint = emailHint;
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/login`,
                scopes: 'https://www.googleapis.com/auth/gmail.readonly',
                queryParams
            }
        });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Google Consent Sign In Error:', error);
        throw error;
    }
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error);
}
