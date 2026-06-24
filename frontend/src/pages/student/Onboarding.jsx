import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import studentService from '../../services/studentService';

const Onboarding = () => {
    const navigate = useNavigate();

    const handleConnectGmail = async () => {
        try {
            const res = await studentService.getGmailAuthUrl();
            if (res?.authUrl) {
                // Let the OAuth callback redirect them back to settings or dashboard
                // We'll set the flag so they don't see this again
                localStorage.setItem('onboarding_completed', 'true');
                window.location.href = res.authUrl;
            }
        } catch (error) {
            console.error("Failed to get auth url:", error);
            alert("Failed to connect to Google.");
        }
    };

    const handleSkip = () => {
        localStorage.setItem('onboarding_completed', 'true');
        navigate('/student');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-8 md:p-10">
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <Mail size={32} />
                        </div>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
                        Welcome to the Competition Portal!
                    </h1>
                    
                    <p className="text-center text-gray-600 mb-8 text-lg">
                        We are automatically tracking your <strong>@citchennai.net</strong> email to seamlessly detect your Hackathon registrations.
                    </p>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
                        <h3 className="text-blue-900 font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle size={18} className="text-blue-600" />
                            Do you use a personal email for competitions?
                        </h3>
                        <p className="text-blue-800 text-sm leading-relaxed mb-4">
                            If you usually register for events (like Devpost, Unstop, etc.) using a <strong>personal Gmail account</strong>, you need to connect it below so we can track your achievements automatically.
                        </p>
                        <p className="text-blue-800 text-sm leading-relaxed font-medium">
                            If you use your college email for everything, you can simply skip this step.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={handleConnectGmail}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm"
                        >
                            <Mail size={18} />
                            Connect Personal Email
                        </button>
                        
                        <button 
                            onClick={handleSkip}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                        >
                            I use my college email
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
