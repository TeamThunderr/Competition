// File Name: App.jsx
// Purpose: Main application component, handles routing (if any)
// Written for beginner developers

import { useState } from 'react'
import Home from './pages/Home'

function App() {
    // What this function does: Renders the Home page
    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow p-4">
                <h1 className="text-xl font-bold text-blue-600">College Competition Platform</h1>
            </nav>
            <main className="p-8">
                <Home />
            </main>
        </div>
    )
}

export default App
