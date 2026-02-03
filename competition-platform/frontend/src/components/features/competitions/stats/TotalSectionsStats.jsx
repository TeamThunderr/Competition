import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

const TotalSectionsStats = ({ data, onSectionClick }) => {
    // We keep all open by default as requested previously, but allow toggling
    const [openYears, setOpenYears] = useState(
        data ? data.map(d => d.year) : []
    );

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-gray-400 h-full">
                <Layers className="w-10 h-10 opacity-20 mb-3" />
                <span className="text-sm font-medium">No Department Data</span>
            </div>
        );
    }

    const toggleYear = (year) => {
        if (openYears.includes(year)) {
            setOpenYears(openYears.filter(y => y !== year));
        } else {
            setOpenYears([...openYears, year]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 bg-white border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 bg-opacity-80">
                        <Layers className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm md:text-base">Total Sections In Dept</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Academic Years Overview</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-3 bg-gray-50/50">
                {data.map((group, idx) => {
                    const isOpen = openYears.includes(group.year);
                    return (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
                            <button
                                onClick={() => toggleYear(group.year)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                    <span className="font-bold text-gray-700 text-sm">{group.year}</span>
                                </div>
                                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200">
                                    {group.totalStudents} Students
                                </span>
                            </button>

                            {isOpen && (
                                <div className="border-t border-gray-100 bg-gray-50/30">
                                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 p-3">
                                        {group.sections.map((sec, sIdx) => (
                                            <button
                                                key={sIdx}
                                                onClick={() => onSectionClick(sec.students || [], `${group.year} - Section ${sec.name} Students`, sec.name)}
                                                className="flex flex-col items-start p-2.5 rounded-md bg-white border border-gray-100 hover:border-blue-300 hover:shadow-sm hover:bg-blue-50/50 transition-all duration-200 group text-left"
                                            >
                                                <div className="flex w-full justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600 uppercase tracking-wide">
                                                        Sec {sec.name}
                                                    </span>
                                                    <BookOpen className="w-3 h-3 text-gray-300 group-hover:text-blue-400" />
                                                </div>
                                                <div className="text-sm font-bold text-gray-800">
                                                    {sec.count} <span className="text-[10px] font-normal text-gray-500">students</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TotalSectionsStats;
