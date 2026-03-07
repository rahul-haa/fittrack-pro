/**
 * Login Page — Email/password login with OAuth buttons
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('demo@fittrack.com');
    const [password, setPassword] = useState('demo1234');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glows */}
            <div className="bg-glow w-[400px] h-[400px] bg-neon/20 top-1/4 -left-20" />
            <div className="bg-glow w-[300px] h-[300px] bg-electric/20 bottom-1/4 -right-10" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="glass-card w-full max-w-md p-8 relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.h1
                        className="text-4xl font-black text-gradient mb-2"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        FitTrack Pro
                    </motion.h1>
                    <p className="text-gray-400">Welcome back, champion</p>
                </div>

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-glass"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-glass"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-neon w-full text-center disabled:opacity-50"
                    >
                        {loading ? '⏳ Signing In...' : '🚀 Sign In'}
                    </button>
                </form>

                {/* OAuth */}
                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                        <div className="relative flex justify-center text-xs"><span className="px-3 text-gray-500 bg-[#0f1420]">or continue with</span></div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        {[
                            { name: 'Google', icon: '🔵' },
                            { name: 'Apple', icon: '🍎' },
                            { name: 'Facebook', icon: '📘' },
                        ].map((provider) => (
                            <button
                                key={provider.name}
                                className="btn-glass py-2.5 text-center text-sm flex items-center justify-center gap-2"
                                onClick={() => alert(`${provider.name} OAuth — requires API keys`)}
                            >
                                <span>{provider.icon}</span>
                                <span className="hidden sm:inline">{provider.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Register link */}
                <p className="mt-6 text-center text-sm text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-neon hover:text-neon-dim transition-colors font-medium">
                        Sign Up
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
