import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import FacultySidebar from './Sidebar';
import { Menu } from 'lucide-react';
import logo from '../../assets/logo.png';

const FacultyLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex bg-background min-h-screen font-sans transition-colors duration-200">
            <FacultySidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 ml-0 md:ml-sidebar p-4 md:p-8 w-full max-w-full overflow-x-hidden min-w-0">
                <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-20">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        <Menu size={24} />
                    </button>
                    <img src={logo} alt="Logo" className="h-8 object-contain mix-blend-multiply" />
                    <div className="w-10"></div>
                </div>

                <div className="w-full">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default FacultyLayout;
