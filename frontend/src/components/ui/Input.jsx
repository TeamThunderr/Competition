import React, { forwardRef } from 'react';

export const Input = forwardRef(({
    label,
    error,
    className = '',
    id,
    type = 'text',
    ...props
}, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    ref={ref}
                    id={inputId}
                    type={type}
                    className={`
            block w-full rounded-lg border px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500
            focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500
            disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-400
            bg-white dark:bg-slate-900
            transition-colors
            ${error
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-slate-600'
                        }
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
});

export default Input;
