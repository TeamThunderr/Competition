import React from 'react';

export const Table = ({ children, className = '', ...props }) => {
    return (
        <div className={`overflow-x-auto w-full ${className}`} {...props}>
            <table className="w-full text-sm text-left">
                {children}
            </table>
        </div>
    );
};

export const TableHeader = ({ children, className = '', ...props }) => {
    return (
        <thead className={`text-xs uppercase bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 ${className}`} {...props}>
            <tr>
                {children}
            </tr>
        </thead>
    );
};

export const TableBody = ({ children, className = '', ...props }) => {
    return (
        <tbody className={`divide-y divide-gray-200 dark:divide-slate-700 ${className}`} {...props}>
            {children}
        </tbody>
    );
};

export const TableRow = ({ children, className = '', ...props }) => {
    return (
        <tr
            className={`bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${className}`}
            {...props}
        >
            {children}
        </tr>
    );
};

export const TableHead = ({ children, className = '', ...props }) => {
    return (
        <th
            scope="col"
            className={`px-6 py-4 font-semibold whitespace-nowrap ${className}`}
            {...props}
        >
            {children}
        </th>
    );
};

export const TableCell = ({ children, className = '', ...props }) => {
    return (
        <td
            className={`px-6 py-4 whitespace-nowrap text-gray-900 dark:text-slate-200 ${className}`}
            {...props}
        >
            {children}
        </td>
    );
};

export default Table;
