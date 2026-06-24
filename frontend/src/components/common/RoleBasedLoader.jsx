import React from 'react';
import { motion } from 'framer-motion';

/**
 * Classy, Minimalist Loader Component
 * 
 * Displays a premium, pulsing animation using the CIT logo.
 */
const RoleBasedLoader = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
            <div className="relative flex items-center justify-center">
                {/* Outer Breathing Ring 1 */}
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute w-24 h-24 rounded-full border border-gray-200 dark:border-white/10"
                />
                
                {/* Outer Breathing Ring 2 */}
                <motion.div
                    animate={{
                        scale: [1, 2.2, 1],
                        opacity: [0, 0.3, 0],
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.3
                    }}
                    className="absolute w-24 h-24 rounded-full border border-gray-200 dark:border-white/5"
                />

                {/* Core Glow */}
                <motion.div
                    animate={{
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute w-16 h-16 rounded-full bg-indigo-50 dark:bg-white/5 blur-xl"
                />
                
                {/* Core Element (CIT Logo) */}
                <motion.div 
                    animate={{ scale: [0.98, 1.05, 0.98] }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative w-16 h-16 bg-white dark:bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-white/20 z-10"
                >
                    <img src="/cit.png" alt="Loading..." className="w-8 h-8 object-contain" />
                </motion.div>
            </div>

            {/* Minimal Text */}
            <motion.p 
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="mt-8 text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 dark:text-gray-400"
            >
                Loading
            </motion.p>
        </div>
    );
};

export default RoleBasedLoader;
