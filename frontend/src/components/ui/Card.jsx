import React from 'react';

export const Card = ({ children, className = '', noPadding = false, ...props }) => {
    return (
        <div
            className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 ${noPadding ? '' : 'p-6'} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = '', ...props }) => {
    return (
        <div className={`px-6 py-4 border-b border-gray-200 dark:border-zinc-800 ${className}`} {...props}>
            {children}
        </div>
    );
};

export const CardTitle = ({ children, className = '', ...props }) => {
    return (
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`} {...props}>
            {children}
        </h3>
    );
};

export const CardContent = ({ children, className = '', ...props }) => {
    return (
        <div className={`p-6 ${className}`} {...props}>
            {children}
        </div>
    );
};

export default Card;
