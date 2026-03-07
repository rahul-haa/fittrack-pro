import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { BadgeProvider } from './context/BadgeContext';
import Sidebar from './components/Sidebar';
import BadgeUnlock from './components/BadgeUnlock';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WaterTracker from './pages/WaterTracker';
import Profile from './pages/Profile';
import Goals from './pages/Goals';
import Workouts from './pages/Workouts';
import Nutrition from './pages/Nutrition';
import Social from './pages/Social';
import Settings from './pages/Settings';
import AICoach from './pages/AICoach';

function ProtectedLayout() {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-neon/30 border-t-neon rounded-full animate-spin" />
        </div>
    );
    if (!user) return <Navigate to="/login" />;

    return (
        <div className="min-h-screen flex">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 lg:ml-[260px] min-h-screen">
                {/* Mobile topbar */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5">
                    <button onClick={() => setSidebarOpen(true)} className="text-white text-xl">☰</button>
                    <h1 className="text-lg font-bold text-gradient">FitTrack Pro</h1>
                    <div className="w-8" />
                </div>
                <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
            {/* Background glows */}
            <div className="bg-glow w-[500px] h-[500px] bg-neon/10 -top-40 -right-40" />
            <div className="bg-glow w-[400px] h-[400px] bg-electric/10 bottom-0 -left-40" style={{ animationDelay: '3s' }} />
        </div>
    );
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (user) return <Navigate to="/dashboard" />;
    return children;
}

export default function App() {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <BrowserRouter>
                <ThemeProvider>
                    <AuthProvider>
                        <BadgeProvider>
                            <BadgeUnlock />
                            <Routes>
                                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                                <Route element={<ProtectedLayout />}>
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/water" element={<WaterTracker />} />
                                    <Route path="/profile" element={<Profile />} />
                                    <Route path="/goals" element={<Goals />} />
                                    <Route path="/workouts" element={<Workouts />} />
                                    <Route path="/nutrition" element={<Nutrition />} />
                                    <Route path="/social" element={<Social />} />
                                    <Route path="/settings" element={<Settings />} />
                                    <Route path="/ai-coach" element={<AICoach />} />
                                </Route>
                                <Route path="*" element={<Navigate to="/login" />} />
                            </Routes>
                        </BadgeProvider>
                    </AuthProvider>
                </ThemeProvider>
            </BrowserRouter>
        </GoogleOAuthProvider>
    );
}
