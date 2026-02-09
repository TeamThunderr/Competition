import React from 'react';
import { AlertTriangle, Info, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "info", // 'info' | 'danger' | 'success'
    loading = false,
    showCancel = true
}) => {
    // Backdrop animation
    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    // Modal animation
    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 10 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
        exit: { opacity: 0, scale: 0.95, y: 10 }
    };

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <AlertTriangle size={24} className="text-red-600 dark:text-red-500" />;
            case 'success':
                return <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-500" />;
            default:
                return <Info size={24} className="text-blue-600 dark:text-blue-500" />;
        }
    };

    const getThemeColors = () => {
        switch (type) {
            case 'danger':
                return {
                    bg: 'bg-red-50 dark:bg-red-500/10',
                    border: 'border-red-100 dark:border-red-500/20',
                    glow: 'shadow-xl shadow-red-500/5 dark:shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]',
                    button: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 border-red-500 text-white'
                };
            case 'success':
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                    border: 'border-emerald-100 dark:border-emerald-500/20',
                    glow: 'shadow-xl shadow-emerald-500/5 dark:shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]',
                    button: 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 border-emerald-500 text-white'

                };
            default:
                return {
                    bg: 'bg-blue-50 dark:bg-blue-500/10',
                    border: 'border-blue-100 dark:border-blue-500/20',
                    glow: 'shadow-xl shadow-blue-500/5 dark:shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]',
                    button: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border-blue-500 text-white'
                };
        }
    };

    const theme = getThemeColors();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={!loading ? onClose : undefined}
                    />

                    {/* Modal */}
                    <motion.div
                        className={`relative w-full max-w-md bg-white dark:bg-[#0F1117] rounded-2xl border border-gray-100 dark:border-white/10 ${theme.glow} overflow-hidden`}
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Glossy highlight effect (only visible in dark mode or subtle in light) */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/20 to-transparent opacity-50" />

                        {/* Content */}
                        <div className="p-6 relative">
                            {/* Close Button */}
                            <button
                                onClick={!loading ? onClose : undefined}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                                disabled={loading}
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl flex-shrink-0 ${theme.bg} ${theme.border} border`}>
                                    {getIcon()}
                                </div>

                                <div className="flex-1 pt-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                                        {title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                        {message}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                {showCancel && (
                                    <button
                                        onClick={onClose}
                                        disabled={loading}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg transition-all disabled:opacity-50 border border-gray-200 dark:border-white/5 dark:hover:border-white/10"
                                    >
                                        {cancelText}
                                    </button>
                                )}
                                <button
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className={`relative flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 hover:shadow-xl hover:-translate-y-0.5 border-t border-white/20 ${theme.button}`}
                                >
                                    {loading && (
                                        <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    )}
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
