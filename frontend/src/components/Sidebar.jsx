/**
 * Sidebar — Glassmorphic navigation with theme toggle and neon-highlighted active route
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/water', label: 'Hydration', icon: '💧' },
    { path: '/workouts', label: 'Workouts', icon: '🏋️' },
    { path: '/nutrition', label: 'Nutrition', icon: '🥗' },
    { path: '/goals', label: 'Goals', icon: '🎯' },
    { path: '/ai-coach', label: 'AI Coach', icon: '🤖' },
    { path: '/social', label: 'Community', icon: '👥' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
            )}

            <motion.aside
                initial={{ x: -280 }}
                animate={{ x: isOpen ? 0 : (window.innerWidth >= 1024 ? 0 : -280) }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed top-0 left-0 h-full w-[260px] z-50 glass-card border-r flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                style={{ borderColor: 'var(--glass-border)' }}
            >
                {/* Logo */}
                <div className="p-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-gradient">FitTrack Pro</h1>
                            <p className="text-xs text-gray-500 mt-1">AI Fitness Companion</p>
                        </div>
                        {/* Theme Toggle */}
                        <motion.button
                            onClick={toggleTheme}
                            whileTap={{ scale: 0.85 }}
                            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 hover:scale-110"
                            style={{
                                borderColor: 'var(--glass-border)',
                                background: 'var(--input-bg)',
                            }}
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            <motion.span
                                key={theme}
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="text-lg"
                            >
                                {theme === 'dark' ? '☀️' : '🌙'}
                            </motion.span>
                        </motion.button>
                    </div>
                </div>

                {/* User Mini Profile */}
                {user && (
                    <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--glass-border)' }}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon to-electric flex items-center justify-center text-black font-bold text-sm">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                                    ? 'bg-neon/10 text-neon border border-neon/20 shadow-neon'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'}`
                            }
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <span>🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </motion.aside>
        </>
    );
}
