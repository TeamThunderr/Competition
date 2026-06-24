import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const CustomDatePicker = ({
    label,
    value,
    onChange,
    name,
    minDate = new Date().toISOString().split('T')[0], // Default: Disable past dates
    required = false,
    className = "",
    placeholder = "Select Date"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
    const containerRef = useRef(null);

    // Sync internal state with prop value
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            setSelectedDate(date);
            setCurrentMonth(date);
        } else {
            setSelectedDate(null);
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Adjust for timezone offset to ensure the date string is correct locally
        // Or simpler: construct string manually YYYY-MM-DD
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const dateDay = String(newDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${dateDay}`;

        // Check minDate
        if (minDate && dateString < minDate) return;

        setSelectedDate(newDate);
        setIsOpen(false);

        // Propagate change
        // Simulate event object for compatibility with standard handlers
        const event = {
            target: {
                name: name,
                value: dateString
            }
        };
        onChange(event);
    };

    const isDateDisabled = (day) => {
        if (!minDate) return false;
        const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, '0');
        const dateDay = String(checkDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${dateDay}`;
        return dateString < minDate;
    };

    const isSelected = (day) => {
        if (!selectedDate) return false;
        return (
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentMonth.getMonth() &&
            selectedDate.getFullYear() === currentMonth.getFullYear()
        );
    };

    const renderCalendar = () => {
        const totalDays = daysInMonth(currentMonth);
        const startDay = firstDayOfMonth(currentMonth);
        const days = [];

        // Empty slots for days before start of month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        // Days
        for (let i = 1; i <= totalDays; i++) {
            const disabled = isDateDisabled(i);
            const selected = isSelected(i);

            days.push(
                <motion.button
                    key={i}
                    whileHover={!disabled ? { scale: 1.1 } : {}}
                    whileTap={!disabled ? { scale: 0.95 } : {}}
                    onClick={() => !disabled && handleDateClick(i)}
                    className={`
                        p-2 w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors relative
                        ${selected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : ''}
                        ${!selected && !disabled ? 'hover:bg-blue-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200' : ''}
                        ${disabled ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    {i}
                    {selected && (
                        <motion.div
                            layoutId="selectedDay"
                            className="absolute inset-0 border-2 border-white rounded-full"
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    )}
                </motion.button>
            );
        }

        return days;
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>}

            {/* Input Trigger */}
            <div
                className="relative group cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={`
                    w-full px-4 py-2 pl-10 border rounded-lg text-sm bg-white dark:bg-black 
                    transition-all duration-200
                    ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-zinc-800 hover:border-blue-400'}
                `}>
                    <span className={selectedDate ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                        {selectedDate ? selectedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : placeholder}
                    </span>
                </div>
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" size={16} />
            </div>

            {/* Dropdown Calendar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-2 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 w-72"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-600 dark:text-gray-300">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="font-bold text-gray-800 dark:text-white">
                                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-600 dark:text-gray-300">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Week Days */}
                        <div className="grid grid-cols-7 text-center mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <span key={day} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{day}</span>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 justify-items-center">
                            {renderCalendar()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomDatePicker;
