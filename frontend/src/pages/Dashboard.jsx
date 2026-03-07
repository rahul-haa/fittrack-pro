/**
 * Dashboard — Central hub with animated charts and summary cards
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import ProgressRing from '../components/ProgressRing';

export default function Dashboard() {
    const { apiFetch } = useAuth();
    const [data, setData] = useState(null);
    const [period, setPeriod] = useState('daily');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, [period]);

    const fetchDashboard = async () => {
        try {
            const res = await apiFetch(`/api/dashboard?period=${period}`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-neon/30 border-t-neon rounded-full" />
            </div>
        );
    }

    if (!data) return <div className="text-center text-gray-400 mt-20">Failed to load dashboard</div>;

    const { summary, charts, goals, recent_badges, user } = data;

    // Prepare chart data
    const calorieChartData = charts?.weekly_calories?.length > 0 ? charts.weekly_calories.map(d => ({
        date: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
        calories: d.burned || 0
    })) : [
        { date: 'Mon', calories: 320 }, { date: 'Tue', calories: 280 }, { date: 'Wed', calories: 450 },
        { date: 'Thu', calories: 200 }, { date: 'Fri', calories: 380 }, { date: 'Sat', calories: 250 },
        { date: 'Sun', calories: 350 }
    ];

    const activeMinData = charts?.active_minutes?.length > 0 ? charts.active_minutes.map(d => ({
        date: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
        minutes: d.minutes || 0
    })) : [
        { date: 'Mon', minutes: 45 }, { date: 'Tue', minutes: 30 }, { date: 'Wed', minutes: 60 },
        { date: 'Thu', minutes: 40 }, { date: 'Fri', minutes: 50 }, { date: 'Sat', minutes: 35 },
        { date: 'Sun', minutes: 45 }
    ];

    const stepProgress = summary.steps_today ? Math.min(100, (summary.steps_today / 10000) * 100) : 75;

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white">Dashboard</h1>
                    <p className="text-gray-400 mt-1">Welcome back, <span className="text-neon">{user?.name || 'Champion'}</span> 🔥</p>
                </div>

                {/* Period Toggle */}
                <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                    {['daily', 'weekly', 'monthly'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                ${period === p ? 'bg-gradient-to-r from-neon/20 to-electric/20 text-neon border border-neon/30' : 'text-gray-400 hover:text-white'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Streak', value: `${summary.streak}d`, icon: '🔥', color: '#FF6B35' },
                    { label: 'Workouts', value: summary.workouts_completed, icon: '🏋️', color: '#00FF88' },
                    { label: 'Calories', value: `${summary.calories_burned_today || 0}`, icon: '⚡', color: '#00C8FF' },
                    { label: 'Water', value: `${((summary.water_today_ml || 0) / 1000).toFixed(1)}L`, icon: '💧', color: '#00C8FF' },
                ].map((card, i) => (
                    <GlassCard key={card.label} hover delay={i * 0.1} className="p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{card.icon}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider">{card.label}</span>
                        </div>
                        <motion.p
                            className="text-3xl font-black text-white"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                        >
                            {card.value}
                        </motion.p>
                    </GlassCard>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Calories Burned Line Chart */}
                <GlassCard delay={0.2} className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Calories Burned</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={calorieChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="#666" fontSize={12} />
                            <YAxis stroke="#666" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: 'rgba(10,14,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                            />
                            <Line type="monotone" dataKey="calories" stroke="#00FF88" strokeWidth={3} dot={{ fill: '#00FF88', r: 4 }}
                                activeDot={{ fill: '#00FF88', r: 6, stroke: '#00FF88', strokeWidth: 2 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </GlassCard>

                {/* Active Minutes Bar Chart */}
                <GlassCard delay={0.3} className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Active Minutes</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={activeMinData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="#666" fontSize={12} />
                            <YAxis stroke="#666" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: 'rgba(10,14,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                            />
                            <Bar dataKey="minutes" fill="#00C8FF" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            {/* Progress Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step Count */}
                <GlassCard delay={0.4} className="p-6 flex flex-col items-center">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Step Count</h3>
                    <ProgressRing progress={stepProgress} size={140} color="#00FF88" value={summary.steps_today || 7500} unit="/ 10,000 steps" />
                </GlassCard>

                {/* Water Progress */}
                <GlassCard delay={0.5} className="p-6 flex flex-col items-center">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Water Intake</h3>
                    <ProgressRing progress={summary.water_progress || 60} size={140} color="#00C8FF"
                        value={`${((summary.water_today_ml || 1500) / 1000).toFixed(1)}L`}
                        unit={`/ ${((summary.water_goal_ml || 2500) / 1000).toFixed(1)}L`}
                    />
                </GlassCard>

                {/* XP & Level */}
                <GlassCard delay={0.6} className="p-6 flex flex-col items-center">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Level</h3>
                    <ProgressRing
                        progress={(summary.xp % 100)}
                        size={140}
                        color="#FF6B35"
                        value={`Lv ${Math.floor(summary.xp / 100) + 1}`}
                        unit={`${summary.xp} XP`}
                    />
                </GlassCard>
            </div>

            {/* Goals & Badges Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Goals */}
                <GlassCard delay={0.7} className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Goals Progress</h3>
                    <div className="space-y-4">
                        {goals?.length > 0 ? goals.map((goal, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-300 capitalize">{goal.type.replace('_', ' ')}</span>
                                        <span className="text-sm text-neon">{goal.progress_percent}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ background: 'linear-gradient(90deg, #00FF88, #00C8FF)' }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, goal.progress_percent)}%` }}
                                            transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                        />
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 w-20 text-right">
                                    {goal.current_value}/{goal.target_value} {goal.unit}
                                </span>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm">No goals set yet. Set your first goal!</p>
                        )}
                    </div>
                </GlassCard>

                {/* Recent Badges */}
                <GlassCard delay={0.8} className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Badges</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {recent_badges?.length > 0 ? recent_badges.map((badge, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 + i * 0.1 }}
                                className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 hover:border-neon/30 transition-all"
                            >
                                <span className="text-2xl">{badge.icon}</span>
                                <div>
                                    <p className="text-sm font-medium text-white">{badge.name}</p>
                                    <p className="text-xs text-gray-500">{badge.description}</p>
                                </div>
                            </motion.div>
                        )) : (
                            <p className="text-gray-500 text-sm col-span-2">Complete activities to earn badges! 🏆</p>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
