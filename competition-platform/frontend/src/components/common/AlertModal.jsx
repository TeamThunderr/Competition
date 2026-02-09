import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

const AlertModal = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info', // 'info' | 'success' | 'warning' | 'danger'
    autoClose = false,
    duration = 3000
}) => {

    useEffect(() => {
        if (isOpen && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, duration, onClose]);

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 10 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
        exit: { opacity: 0, scale: 0.95, y: 10 }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle2 size={24} className="text-emerald-500" />;
            case 'danger':
                return <AlertCircle size={24} className="text-red-500" />;
            case 'warning':
                return <AlertTriangle size={24} className="text-amber-500" />;
            default:
                return <Info size={24} className="text-blue-500" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success':
                return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';
            case 'danger':
                return 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20';
            case 'warning':
                return 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20';
            default:
                return 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-auto">
                    <motion.div
                        className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative w-full max-w-sm bg-white dark:bg-[#0F1117] rounded-2xl border border-gray-100 dark:border-white/10 shadow-xl overflow-hidden pointer-events-auto"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-xl flex-shrink-0 border ${getColors()}`}>
                                    {getIcon()}
                                </div>
                                <div className="flex-1 pt-0.5">
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                        {title}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                        {message}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        {/* Progress bar line if autoClose? Optional, easier to just skip for now */}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AlertModal;
