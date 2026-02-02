import React, { useState } from 'react';
import HodSidebar from './Sidebar';
import { Menu } from 'lucide-react';
import logo from '../../assets/logo.png'; // Import default logo for mobile header

const HodLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex bg-background min-h-screen font-sans transition-colors duration-200">
            {/* Sidebar with mobile toggle props */}
            <HodSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 w-full max-w-full overflow-x-hidden min-w-0">
                {/* Mobile Header: Visible only on mobile */}
                <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-20">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        <Menu size={24} />
                    </button>

                    <img src={logo} alt="Logo" className="h-8 object-contain mix-blend-multiply" />

                    {/* Placeholder for balance */}
                    <div className="w-10"></div>
                </div>

                {/* Main Content */}
                <div className="w-full">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default HodLayout;
