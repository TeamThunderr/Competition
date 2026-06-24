import React from 'react';
import { PackageOpen } from 'lucide-react'; /** Using Lucide-react icons or fallback */
/** Assuming Lucide is installed as seen in other files */

export const EmptyState = ({
    icon: Icon = PackageOpen,
    title = 'No data available',
    description = 'There is nothing to show here yet.',
    action = null,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 ${className}`}>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-full shadow-sm mb-4">
                <Icon size={32} className="text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {title}
            </h3>
            <p className="text-gray-500 dark:text-zinc-400 max-w-sm mb-6">
                {description}
            </p>
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
