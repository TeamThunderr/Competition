// File Name: Home.jsx
// Purpose: Homepage component
// Written for beginner developers

import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const Home = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <main className="flex-grow container mx-auto p-10 text-center">
                <h1 className="text-4xl font-bold text-blue-600 mb-4">
                    College Competition Management Platform
                </h1>
                <p className="text-xl text-gray-700 mb-8">
                    Welcome to the centralized platform for all college events and competitions.
                </p>
                <div className="bg-white p-6 shadow rounded-lg border border-gray-200 inline-block">
                    <h2 className="text-xl font-semibold mb-2">Get Started</h2>
                    <p className="text-gray-600">Login or Sign Up to participate!</p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Home;
