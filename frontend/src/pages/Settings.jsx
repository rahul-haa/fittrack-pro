import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';

export default function Settings() {
    const { apiFetch, user, logout } = useAuth();
    const [prefs, setPrefs] = useState(null);
    const [profile, setProfile] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        const [prefsRes, profileRes] = await Promise.all([
            apiFetch('/api/notifications/preferences'),
            apiFetch('/api/users/me'),
        ]);
        setPrefs(await prefsRes.json());
        setProfile(await profileRes.json());
    };

    const updatePref = async (key, value) => {
        await apiFetch('/api/notifications/preferences', {
            method: 'PUT', body: JSON.stringify({ [key]: value })
        });
        setPrefs({ ...prefs, [key]: value });
        flashSaved();
    };

    const updateProfile = async (key, value) => {
        await apiFetch('/api/users/me', {
            method: 'PUT', body: JSON.stringify({ [key]: value })
        });
        setProfile({ ...profile, [key]: value });
        flashSaved();
    };

    const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

    const Toggle = ({ label, value, onChange }) => (
        <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-300">{label}</span>
            <button onClick={() => onChange(!value)}
                className={`w-12 h-6 rounded-full transition-all relative ${value ? 'bg-neon/60' : 'bg-white/10'}`}>
                <motion.div animate={{ x: value ? 24 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`w-5 h-5 rounded-full absolute top-0.5 ${value ? 'bg-neon' : 'bg-gray-500'}`} />
            </button>
        </div>
    );

    if (!prefs || !profile) return null;

    const tiers = [
        { name: 'Free', price: '$0', features: ['Basic tracking', 'Exercise library', '3 goals'] },
        { name: 'Pro', price: '$9.99/mo', features: ['Unlimited goals', 'AI workout plans', 'Advanced analytics', 'Priority support'], current: profile.subscription === 'pro' },
        { name: 'Elite', price: '$19.99/mo', features: ['Everything in Pro', '1-on-1 coaching', 'Live classes', 'Custom meal plans', 'Wearable sync'], current: profile.subscription === 'elite' },
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-black text-white">Settings</h1>
                <p className="text-gray-400 mt-1">Manage your account and preferences ⚙️</p>
            </motion.div>

            {saved && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="p-3 rounded-xl bg-neon/10 border border-neon/30 text-neon text-sm text-center">✅ Settings saved</motion.div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                <GlassCard delay={0.1} className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Profile Settings</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-400">Name</label>
                            <input className="input-glass mt-1" defaultValue={profile.name} onBlur={e => updateProfile('name', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm text-gray-400">Wake Time</label>
                                <input type="time" className="input-glass mt-1" defaultValue={profile.wake_time} onBlur={e => updateProfile('wake_time', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Sleep Time</label>
                                <input type="time" className="input-glass mt-1" defaultValue={profile.sleep_time} onBlur={e => updateProfile('sleep_time', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard delay={0.2} className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Notifications</h3>
                    <Toggle label="Workout Reminders" value={!!prefs.workout_reminders} onChange={v => updatePref('workout_reminders', v)} />
                    <Toggle label="Hydration Reminders" value={!!prefs.hydration_reminders} onChange={v => updatePref('hydration_reminders', v)} />
                    <Toggle label="Meal Reminders" value={!!prefs.meal_reminders} onChange={v => updatePref('meal_reminders', v)} />
                    <Toggle label="Daily Check-in" value={!!prefs.daily_checkin} onChange={v => updatePref('daily_checkin', v)} />
                    <Toggle label="Streak Warnings" value={!!prefs.streak_warnings} onChange={v => updatePref('streak_warnings', v)} />
                    <Toggle label="Social Notifications" value={!!prefs.social_notifications} onChange={v => updatePref('social_notifications', v)} />
                </GlassCard>
            </div>

            <GlassCard delay={0.3} className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Subscription Plans</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    {tiers.map((tier, i) => (
                        <div key={tier.name} className={`p-5 rounded-xl border transition-all ${tier.current ? 'border-neon/50 bg-neon/5 shadow-neon' : 'border-white/10 bg-white/5'}`}>
                            <h4 className="text-lg font-bold text-white">{tier.name}</h4>
                            <p className="text-2xl font-black text-gradient mt-1">{tier.price}</p>
                            <ul className="mt-3 space-y-1">
                                {tier.features.map(f => (<li key={f} className="text-xs text-gray-400 flex items-center gap-1"><span className="text-neon">✓</span> {f}</li>))}
                            </ul>
                            {tier.current ? <p className="mt-3 text-xs text-neon font-medium">Current Plan</p>
                                : <button className="btn-glass w-full mt-3 text-xs">Upgrade</button>}
                        </div>
                    ))}
                </div>
            </GlassCard>

            <GlassCard delay={0.4} className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Privacy & Data</h3>
                <div className="space-y-3">
                    <button className="btn-glass w-full text-left text-sm">📥 Export My Data (GDPR)</button>
                    <button className="btn-glass w-full text-left text-sm text-red-400 hover:bg-red-500/10">🗑️ Delete My Account</button>
                </div>
            </GlassCard>
        </div>
    );
}
