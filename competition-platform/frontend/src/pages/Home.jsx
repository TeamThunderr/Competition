// File Name: Home.jsx
// Purpose: Landing page with connection tests
// Written for beginner developers

import { useState, useEffect } from 'react'
import { checkBackendHealth } from '../services/api'
import supabase from '../utils/supabaseClient'

function Home() {
    const [backendStatus, setBackendStatus] = useState('Checking...')
    const [supabaseStatus, setSupabaseStatus] = useState('Checking...')

    // What this function does: Runs connection tests on component mount
    useEffect(() => {
        // 1. Test Backend Connection
        checkBackendHealth()
            .then(data => {
                setBackendStatus(data.message || 'Connected')
            })
            .catch(err => {
                setBackendStatus('Error connecting to backend')
            })

        // 2. Test Supabase Connection
        const testSupabase = async () => {
            // Just check if we can initialize client (connection happens on request usually)
            if (supabase) {
                setSupabaseStatus('Supabase Client Initialized')
            } else {
                setSupabaseStatus('Supabase Failed')
            }
        }
        testSupabase()
    }, []) // Empty array means run once when page loads

    return (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">System Status</h2>

            <div className="space-y-4">
                {/* Backend Status Card */}
                <div className="p-4 border rounded bg-gray-50">
                    <h3 className="font-bold">Backend Server</h3>
                    <p className={backendStatus.includes('Error') ? 'text-red-500' : 'text-green-600'}>
                        Status: {backendStatus}
                    </p>
                </div>

                {/* Supabase Status Card */}
                <div className="p-4 border rounded bg-gray-50">
                    <h3 className="font-bold">Supabase</h3>
                    <p className="text-blue-600">
                        Status: {supabaseStatus}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Home
