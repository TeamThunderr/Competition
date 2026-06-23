import React, { useMemo } from 'react';
import { Users, ChevronRight, User } from 'lucide-react';

const StudentStatsList = ({ title, students, onSectionClick, icon: Icon = Users, colorClass = "text-blue-600" }) => {
    // Group students by section
    const sectionGroups = useMemo(() => {
        const groups = {};
        students.forEach(student => {
            const section = student.section || 'Unknown';
            if (!groups[section]) {
                groups[section] = [];
            }
            groups[section].push(student);
        });
        return groups;
    }, [students]);

    // Sort sections alphabetically
    const sortedSections = useMemo(() => {
        return Object.keys(sectionGroups).sort();
    }, [sectionGroups]);

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
            {/* Header */}
            <div className="px-5 py-4 bg-white border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-opacity-10 ${colorClass.replace('text', 'bg')}`}>
                        <Icon className={`w-5 h-5 ${colorClass}`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm md:text-base">{title}</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Section-wise Breakdown</p>
                    </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold bg-opacity-10 ${colorClass.replace('text', 'bg')} ${colorClass}`}>
                    {students.length}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-200">
                {sortedSections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <User className="w-8 h-8 opacity-20 mb-2" />
                        <span className="text-sm font-medium">No students found</span>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {sortedSections.map(section => (
                            <button
                                key={section}
                                onClick={() => onSectionClick(sectionGroups[section], title, section)}
                                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-all duration-200 group text-left"
                            >
                                <div className="flex items-center">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm
                                        ${colorClass.includes('green') ? 'bg-green-100 text-green-700' :
                                            colorClass.includes('purple') ? 'bg-purple-100 text-purple-700' :
                                                'bg-blue-100 text-blue-700'}`}>
                                        {section}
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                                            Section {section}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center text-gray-400 group-hover:text-gray-600">
                                    <span className="text-sm font-semibold mr-2 px-2 py-0.5 bg-gray-100 rounded-md group-hover:bg-white border border-transparent group-hover:border-gray-200 transition-all">
                                        {sectionGroups[section].length}
                                    </span>
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentStatsList;
