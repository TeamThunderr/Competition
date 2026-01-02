import React, { useState, useEffect } from 'react';
import { Rocket, BookOpen, BarChart3, Settings, Code, Brain, Target, Shield } from 'lucide-react';

/**
 * RoleBasedLoader Component
 * 
 * Displays a unique, animated loader and motivational quote for each user role.
 * 
 * @param {String} role - 'STUDENT', 'FACULTY', 'HOD', 'ADMIN'
 */
const RoleBasedLoader = ({ role = 'STUDENT' }) => {
    const [quote, setQuote] = useState('');

    const config = {
        'STUDENT': {
            icon: Rocket,
            secondaryIcon: Code,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            animation: 'animate-bounce',
            quotes: [
                "Dream it. Build it. Win it.",
                "Code is the poetry of a better world.",
                "Every bug is just a step towards the solution.",
                "Stay hungry. Stay foolish.",
                "Your potential is limitless."
            ]
        },
        'FACULTY': {
            icon: BookOpen,
            secondaryIcon: Brain,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            animation: 'animate-pulse',
            quotes: [
                "Shaping the minds of tomorrow.",
                "Guidance is the greatest gift.",
                "Inspiring excellence, one student at a time.",
                "Knowledge grows when shared."
            ]
        },
        'HOD': {
            icon: BarChart3,
            secondaryIcon: Target,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-200',
            animation: 'animate-spin-slow', // Custom spin for radar feel
            quotes: [
                "Vision without action is just a dream.",
                "Leading with data, driving with purpose.",
                "Excellence is not an act, but a habit.",
                "Strategize. Optimize. Revolutionize."
            ]
        },
        'ADMIN': {
            icon: Settings,
            secondaryIcon: Shield,
            color: 'text-gray-800',
            bgColor: 'bg-gray-100',
            borderColor: 'border-gray-300',
            animation: 'animate-spin',
            quotes: [
                "Keeping the systems secure and stable.",
                "Powering the platform behind the scenes.",
                "With great power comes great responsibility.",
                "System Operational."
            ]
        }
    };

    const currentConfig = config[role] || config['STUDENT'];
    const Icon = currentConfig.icon;
    const SecondaryIcon = currentConfig.secondaryIcon;

    useEffect(() => {
        // Pick a random quote on mount
        const randomQuote = currentConfig.quotes[Math.floor(Math.random() * currentConfig.quotes.length)];
        setQuote(randomQuote);
    }, [role]);

    return (
        <div className="flex flex-col items-center justify-center h-64 w-full">
            <div className="relative mb-8">
                {/* Outer Ring */}
                <div className={`absolute inset-0 rounded-full border-4 ${currentConfig.borderColor} border-t-transparent animate-spin w-20 h-20`}></div>

                {/* Center Icon */}
                <div className={`relative w-20 h-20 rounded-full ${currentConfig.bgColor} flex items-center justify-center shadow-sm`}>
                    <Icon size={32} className={`${currentConfig.color} ${role === 'STUDENT' ? 'animate-bounce' : role === 'FACULTY' ? 'animate-pulse' : ''}`} />
                </div>

                {/* Orbiting Icon (Decorative) */}
                <div className="absolute -top-2 -right-2">
                    <div className={`w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center animate-bounce delay-100`}>
                        <SecondaryIcon size={14} className={currentConfig.color} />
                    </div>
                </div>
            </div>

            <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className={`text-lg font-bold ${currentConfig.color} tracking-tight`}>
                    Loading {role === 'HOD' ? 'Department Data' : role === 'FACULTY' ? 'Details' : 'Competitions'}...
                </h3>
                <p className="text-gray-500 font-medium italic max-w-xs mx-auto">
                    "{quote}"
                </p>
            </div>
        </div>
    );
};

export default RoleBasedLoader;
