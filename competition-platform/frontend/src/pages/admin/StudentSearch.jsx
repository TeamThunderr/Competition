import React from 'react';
import Sidebar from './Sidebar';
import { Search } from 'lucide-react';

const StudentSearch = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Student Search</h1>
                    <p className="text-gray-500 mt-1">Global directory lookup. View history and activity for any student.</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[600px]">
                    <div className="relative max-w-2xl">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Search by Name or Roll Number (e.g. Arjun, 21CSE...)"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentSearch;
