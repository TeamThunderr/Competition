import React from 'react';


const StudentAnalytics = () => {
    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground transition-colors duration-200">
            <div className="flex-1 flex flex-col min-w-0 md:ml-sidebar p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">My Analytics</h1>
                    <p className="text-muted mt-1">Track your performance and participation stats.</p>
                </header>

                <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm transition-colors duration-200">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-foreground">Analytics Coming Soon</h3>
                    <p className="text-muted mt-1">We are working on visualizing your participation data.</p>
                </div>
            </div>
        </div>
    );
};

export default StudentAnalytics;
