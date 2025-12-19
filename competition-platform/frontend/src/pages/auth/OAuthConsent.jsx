import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../services/supabaseClient';

const OAuthConsent = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Error handling consent:', error);
                navigate('/login');
                return;
            }

            if (session) {
                const user = session.user;
                console.log('User authenticated:', user);

                // Verify it is a Google account
                const isGoogle = user.app_metadata.provider === 'google';
                const isVerified = user.role === 'authenticated';
                const email = user.email;
                const isCollegeEmail = email && email.endsWith('@citchennai.net');

                if (!isGoogle) {
                    console.warn('User logged in but not with Google');
                    alert('Please sign in with Google.');
                    await supabase.auth.signOut();
                    navigate('/login');
                    return;
                }

                if (!isCollegeEmail) {
                    console.warn('Invalid email domain:', email);
                    alert('Only @citchennai.net email addresses are allowed.');
                    await supabase.auth.signOut();
                    navigate('/login');
                    return;
                }

                if (isVerified) {
                    // Sync user to backend
                    try {
                        const response = await fetch('http://localhost:5000/api/auth/sync', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                uid: user.id,
                                email: user.email,
                                full_name: user.user_metadata.full_name,
                                avatar_url: user.user_metadata.avatar_url,
                                role: 'student' // Defaulting to student, backend preserves existing role
                            }),
                        });

                        if (response.ok) {
                            console.log('User synced to backend successfully');
                        } else {
                            const errorText = await response.text();
                            console.error('Failed to sync user to backend. Status:', response.status);
                            console.error('Response body:', errorText);
                            alert(`Sync failed: ${errorText}`); // Alert the user to the specific error
                        }
                    } catch (err) {
                        console.error('Error calling backend sync:', err);
                    }

                    navigate('/');
                } else {
                    console.warn('User email not verified');
                    navigate('/login');
                }

            } else {
                const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        navigate(0); // Reload to trigger checkUser
                    }
                });

                return () => {
                    authListener.subscription.unsubscribe();
                };
            }
        };

        checkUser();
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="p-8 bg-white rounded shadow-md text-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Authenticating...</h2>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Please wait while we log you in.</p>
            </div>
        </div>
    );
};

export default OAuthConsent;
