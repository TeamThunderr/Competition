import { createElement, useState } from 'react'

const Login = () => {
    const [activeTab, setActiveTab] = useState('Student')
    const tabs = ['Student', 'Faculty', 'HOD', 'CIT']

    // Title Section
    const title = createElement('div', { className: 'text-center mb-8' }, [
        createElement(
            'h1',
            { className: 'text-3xl font-bold text-gray-900 mb-2', key: 'title' },
            'Welcome Back'
        ),
        createElement(
            'p',
            { className: 'text-gray-500 text-sm', key: 'subtitle' },
            'Student Competition Portal'
        ),
    ])

    // Tabs Section
    const tabList = createElement(
        'div',
        { className: 'flex justify-center space-x-6 border-b border-gray-100 mb-8' },
        tabs.map((tab) =>
            createElement(
                'button',
                {
                    key: tab,
                    onClick: () => setActiveTab(tab),
                    className: `pb-2 text-sm font-medium transition-colors relative ${activeTab === tab
                            ? 'text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`,
                },
                [
                    tab,
                    activeTab === tab && createElement('div', {
                        key: 'indicator',
                        className: 'absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full'
                    })
                ]
            )
        )
    )

    // Google Sign In Button
    const googleButton = createElement(
        'button',
        {
            className:
                'w-full flex items-center justify-center space-x-3 border border-gray-100 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg transition-all duration-200 shadow-sm mb-6 group',
            onClick: () => console.log(`Login as ${activeTab}`),
        },
        [
            createElement(
                'svg',
                {
                    className: 'w-5 h-5',
                    viewBox: '0 0 48 48',
                    key: 'icon',
                },
                [
                    createElement('path', {
                        fill: '#EA4335',
                        d: 'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z',
                        key: 'p1'
                    }),
                    createElement('path', {
                        fill: '#4285F4',
                        d: 'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z',
                        key: 'p2'
                    }),
                    createElement('path', {
                        fill: '#FBBC05',
                        d: 'M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z',
                        key: 'p3'
                    }),
                    createElement('path', {
                        fill: '#34A853',
                        d: 'M24 48c6.48 0 11.95-2.09 15.81-5.62l-7.73-6c-2.15 1.45-4.92 2.3-8.08 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z',
                        key: 'p4'
                    }),
                ]
            ),
            createElement(
                'span',
                { key: 'text' },
                `Sign in to ${activeTab} Portal`
            ),
        ]
    )

    // Footer Divider Text
    const footerText = createElement(
        'div',
        { className: 'flex items-center justify-between mt-4' },
        [
            createElement('div', { className: 'h-px flex-1 bg-gray-100', key: 'l1' }),
            createElement('span', { className: 'text-xs text-gray-400 px-3', key: 't1' }, 'College Gmail ID Required'),
            createElement('div', { className: 'h-px flex-1 bg-gray-100', key: 'l2' })
        ]
    )

    return createElement(
        'div',
        {
            className: 'bg-white p-12 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[460px]',
        },
        [title, tabList, googleButton, footerText]
    )
}

export default Login
