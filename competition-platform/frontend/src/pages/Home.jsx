import Navbar from '../components/common/Navbar';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl sm:tracking-tight lg:text-6xl">
                    College Competition Platform
                </h1>
                <p className="mt-5 max-w-xl mx-auto text-xl text-muted">
                    Manage competitions, teams, and approvals seamlessly.
                </p>
                <div className="mt-8 flex justify-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700"
                    >
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
