import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Users, ShieldCheck, ArrowRight, Sparkles, Zap, Award } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import LoginForm from '../components/auth/LoginForm';

const Home = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-white overflow-hidden selection:bg-indigo-500 selection:text-white font-sans transition-colors duration-300">
            <Navbar />

            {/* Ambient Background Lights */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-300/30 dark:bg-indigo-800/20 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-300/30 dark:bg-purple-800/20 rounded-full blur-[150px] animate-pulse delay-1000" />
            </div>

            <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* Left Content (Text) */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex-1 text-center lg:text-left"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 dark:bg-white/5 border border-indigo-200 dark:border-white/10 text-xs font-medium text-indigo-600 dark:text-indigo-300 mb-6 backdrop-blur-sm shadow-sm"
                        >
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            The #1 Platform for College Competitions
                        </motion.div>

                        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 leading-[1.1] text-gray-900 dark:text-white">
                            Elevate Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                                Campus Competitions
                            </span>
                        </h1>

                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                            A premium platform to manage events, track teams, and streamline approvals. Designed for excellence, built for champions.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link to="/login">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center gap-2 transition-all"
                                >
                                    Get Started
                                    <ArrowRight className="w-5 h-5" />
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Right Content (Login Form) */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex-1 w-full max-w-md lg:max-w-full relative justify-center flex"
                    >
                        {/* Decorative background blob for the form */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2rem] blur-2xl opacity-20 transform rotate-6 scale-95" />

                        {/* Embedded Login Form */}
                        <LoginForm />

                    </motion.div>

                </div>

                {/* Features Section */}
                <div className="mt-32">
                    <p className="text-center text-gray-500 dark:text-gray-500 text-sm font-semibold uppercase tracking-widest mb-12">
                        Powering Next-Gen Competitions
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureBox
                            icon={Sparkles}
                            title="Easy Management"
                            desc="Create and manage competitions with our intuitive drag-and-drop tools."
                        />
                        <FeatureBox
                            icon={Users}
                            title="Team Formation"
                            desc="Students can form teams, invite members, and manage roles effortlessly."
                        />
                        <FeatureBox
                            icon={ShieldCheck}
                            title="Instant Approvals"
                            desc="HODs can review and approve requests with a single click."
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

const FeatureBox = ({ icon: Icon, title, desc }) => (
    <div className="p-6 bg-white/60 dark:bg-white/5 border border-indigo-100 dark:border-white/5 rounded-2xl hover:bg-white/80 dark:hover:bg-white/[0.07] transition-colors group shadow-sm hover:shadow-md">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/20 transition-colors">
            <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h4>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{desc}</p>
    </div>
);

export default Home;
