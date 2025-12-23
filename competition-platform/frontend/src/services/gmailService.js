const API_URL = 'http://localhost:5000/api/gmail';

export const scanInbox = async (providerToken, user) => {
    // We pass user in headers or body if needed by backend middleware, 
    // or backend infers it.
    // Ideally we need to send the JWT token of the *user* for auth, and the providerToken for Gmail.

    // For this environment, we are sending provider_token in body. 
    // We assume the user is already authenticated via Supabase session on frontend, 
    // but the backend might need a way to identify the user if not fully stateless.
    // For now, let's just send the token.

    // NOTE: In a real Supabase app, supabase.auth.getSession() access_token is the one to send in Authorization header
    // to identify the user to the backend. The provider_token is extra.

    // Let's grab the current user's generic auth token first
    const session = JSON.parse(localStorage.getItem('sb-aehecusqhtiwgjwlhtfj-auth-token'));
    const authToken = session?.access_token;

    const storedUser = localStorage.getItem('user');
    const userData = storedUser ? JSON.parse(storedUser) : null;
    const userId = userData?.id;

    const response = await fetch(`${API_URL}/scan`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`, // If backend uses this
            'x-user-id': userId
        },
        body: JSON.stringify({ provider_token: providerToken })
    });

    if (!response.ok) {
        throw new Error('Scan failed');
    }

    return await response.json();
};
