// File Name: api.js
// Purpose: Handle API requests to the backend
// Written for beginner developers

const API_URL = 'http://localhost:5000'

// What this function does: Checks if the backend server is running
export async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_URL}/health`)
        const data = await response.json()
        return data
    } catch (error) {
        console.error('API Error:', error)
        throw error
    }
}
