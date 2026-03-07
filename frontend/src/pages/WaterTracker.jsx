/**
 * WaterTracker — Primary Feature
 * Visual water bottle/wave tracker with smart reminders, timeline, and logging.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import WaterWave from '../components/WaterWave';

export default function WaterTracker() {
    const { apiFetch } = useAuth();
    const [todayData, setTodayData] = useState(null);
    const [settings, setSettings] = useState(null);
    const [reminders, setReminders] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [todayRes, settingsRes, remindersRes] = await Promise.all([
                apiFetch('/api/water/today'),
                apiFetch('/api/water/settings'),
                apiFetch('/api/water/reminders'),
            ]);
            setTodayData(await todayRes.json());
            setSettings(await settingsRes.json());
            setReminders(await remindersRes.json());
        } catch (err) {
            console.error('Water fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const logWater = async (amount) => {
        try {
            const res = await apiFetch('/api/water/log', {
                method: 'POST',
                body: JSON.stringify({ amount_ml: amount })
            });
            const data = await res.json();
            // Refresh today data
            const todayRes = await apiFetch('/api/water/today');
            setTodayData(await todayRes.json());
        } catch (err) {
            console.error('Log water error:', err);
        }
    };

    const updateSettings = async (newSettings) => {
        try {
            const res = await apiFetch('/api/water/settings', {
                method: 'PUT',
                body: JSON.stringify(newSettings)
            });
            setSettings(await res.json());
            setShowSettings(false);
            fetchAll(); // Refresh reminders
        } catch (err) {
            console.error('Settings update error:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-electric/30 border-t-electric rounded-full" />
            </div>
        );
    }

    const cupSize = settings?.cup_size_ml || 250;
    const dailyGoal = settings?.daily_goal_ml || 2500;
    const totalToday = todayData?.total_ml || 0;
    const progress = Math.min(100, (totalToday / dailyGoal) * 100);

    const quickAmounts = [
        { label: 'Small', amount: 150, icon: '🥤' },
        { label: 'Cup', amount: cupSize, icon: '☕' },
        { label: 'Bottle', amount: 500, icon: '🧴' },
        { label: 'Large', amount: 750, icon: '🫗' },
    ];

    const currentHour = new Date().getHours();

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white">Hydration Tracker</h1>
                    <p className="text-gray-400 mt-1">Stay hydrated, stay healthy 💧</p>
                </div>
                <button onClick={() => setShowSettings(!showSettings)} className="btn-glass text-sm">
                    ⚙️ Settings
                </button>
            </motion.div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Water Bottle Visual */}
                <GlassCard delay={0.1} className="p-8 flex flex-col items-center lg:col-span-1">
                    <WaterWave percentage={progress} size={200} />
                    <div className="mt-6 text-center">
                        <p className="text-2xl font-black text-white">{(totalToday / 1000).toFixed(1)}L</p>
                        <p className="text-sm text-gray-400">of {(dailyGoal / 1000).toFixed(1)}L goal</p>
                    </div>

                    {/* Quick Log Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-6 w-full">
                        {quickAmounts.map((item) => (
                            <motion.button
                                key={item.label}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => logWater(item.amount)}
                                className="btn-glass py-3 text-center text-sm flex flex-col items-center gap-1"
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-white font-medium">{item.amount}ml</span>
                                <span className="text-xs text-gray-500">{item.label}</span>
                            </motion.button>
                        ))}
                    </div>

                    {progress >= 100 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mt-4 p-3 rounded-xl bg-neon/10 border border-neon/30 text-neon text-sm text-center w-full"
                        >
                            🎉 Daily goal achieved! Great job!
                        </motion.div>
                    )}
                </GlassCard>

                {/* Right Side */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Today's Timeline */}
                    <GlassCard delay={0.2} className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Today's Timeline</h3>
                        <div className="grid grid-cols-12 gap-1">
                            {todayData?.hourly_breakdown?.filter(h => h.hour >= 6 && h.hour <= 23).map((h) => (
                                <div key={h.hour} className="flex flex-col items-center">
                                    <div
                                        className={`w-full h-16 rounded-lg transition-all relative overflow-hidden ${h.amount_ml > 0 ? '' : 'bg-white/5'
                                            }`}
                                        title={`${h.hour}:00 — ${h.amount_ml}ml`}
                                    >
                                        {h.amount_ml > 0 && (
                                            <motion.div
                                                className="absolute bottom-0 w-full rounded-lg"
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.min(100, (h.amount_ml / 400) * 100)}%` }}
                                                transition={{ delay: 0.3 + h.hour * 0.03 }}
                                                style={{
                                                    background: h.hour === currentHour
                                                        ? 'linear-gradient(180deg, #00FF88, #00C8FF)'
                                                        : 'linear-gradient(180deg, rgba(0,200,255,0.6), rgba(0,200,255,0.3))'
                                                }}
                                            />
                                        )}
                                    </div>
                                    <span className={`text-xs mt-1 ${h.hour === currentHour ? 'text-neon font-bold' : 'text-gray-600'}`}>
                                        {h.hour}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Smart Reminders */}
                    <GlassCard delay={0.3} className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Smart Reminders</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {reminders?.reminders?.map((r, i) => {
                                const [rh] = r.time.split(':').map(Number);
                                const isPast = rh < currentHour;
                                const isCurrent = rh === currentHour;

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 + i * 0.05 }}
                                        className={`p-3 rounded-xl text-center border transition-all
                      ${isCurrent ? 'border-neon/50 bg-neon/10 shadow-neon' :
                                                isPast ? 'border-white/5 bg-white/3 opacity-50' :
                                                    'border-white/10 bg-white/5'}`}
                                    >
                                        <p className={`text-sm font-bold ${isCurrent ? 'text-neon' : isPast ? 'text-gray-500' : 'text-white'}`}>{r.time}</p>
                                        <p className="text-xs text-gray-500">{r.amount_ml}ml</p>
                                        {isPast && <span className="text-xs text-gray-600">✓</span>}
                                        {isCurrent && <span className="text-xs text-neon">Now</span>}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </GlassCard>

                    {/* Today's Log */}
                    <GlassCard delay={0.4} className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Log History</h3>
                        {todayData?.logs?.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {todayData.logs.map((log, i) => (
                                    <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">💧</span>
                                            <div>
                                                <p className="text-sm font-medium text-white">{log.amount_ml}ml</p>
                                                <p className="text-xs text-gray-500">{new Date(log.logged_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-600">Cup #{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No water logged today. Start hydrating!</p>
                        )}
                    </GlassCard>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowSettings(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card w-full max-w-md p-6"
                    >
                        <h3 className="text-xl font-bold text-white mb-6">Water Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Daily Goal (ml)</label>
                                <input
                                    type="number"
                                    defaultValue={dailyGoal}
                                    className="input-glass"
                                    id="waterGoal"
                                />
                                <p className="text-xs text-gray-600 mt-1">Suggested: {settings?.suggested_goal_ml || 2500}ml based on your weight</p>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Cup Size (ml)</label>
                                <input type="number" defaultValue={cupSize} className="input-glass" id="cupSize" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Reminder Interval (minutes)</label>
                                <input type="number" defaultValue={settings?.reminder_interval_minutes || 90} className="input-glass" id="interval" />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowSettings(false)} className="btn-glass flex-1">Cancel</button>
                                <button
                                    onClick={() => updateSettings({
                                        daily_goal_ml: parseInt(document.getElementById('waterGoal').value),
                                        cup_size_ml: parseInt(document.getElementById('cupSize').value),
                                        reminder_interval_minutes: parseInt(document.getElementById('interval').value)
                                    })}
                                    className="btn-neon flex-1 text-center"
                                >Save</button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
