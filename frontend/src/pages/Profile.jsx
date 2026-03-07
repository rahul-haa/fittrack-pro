/**
 * Profile Page — Avatar, stats, badges, streak visualization
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import ProgressRing from '../components/ProgressRing';

export default function Profile() {
    const { apiFetch, user: authUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [badges, setBadges] = useState([]);
    const [xp, setXp] = useState(null);
    const [streak, setStreak] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const [profileRes, badgesRes, xpRes, streakRes] = await Promise.all([
                apiFetch('/api/users/me'),
                apiFetch('/api/gamification/badges'),
                apiFetch('/api/gamification/xp'),
                apiFetch('/api/gamification/streak'),
            ]);
            setProfile(await profileRes.json());
            setBadges(await badgesRes.json());
            setXp(await xpRes.json());
            setStreak(await streakRes.json());
        } catch (err) {
            console.error('Profile fetch error:', err);
        }
    };

    if (!profile) {
        return (
            <div className="flex items-center justify-center h-full">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-neon/30 border-t-neon rounded-full" />
            </div>
        );
    }

    const earnedBadges = badges.filter(b => b.earned);
    const unearnedBadges = badges.filter(b => !b.earned);

    return (
        <div className="space-y-6">
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-black text-white">Profile</motion.h1>

            {/* Profile Card */}
            <GlassCard delay={0.1} className="p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Avatar */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-neon to-electric flex items-center justify-center text-black text-3xl font-black shadow-neon"
                    >
                        {profile.name?.charAt(0)?.toUpperCase()}
                    </motion.div>

                    <div className="text-center sm:text-left flex-1">
                        <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                        <p className="text-gray-400">{profile.email}</p>
                        <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                            <span className="px-3 py-1 rounded-full bg-neon/10 text-neon text-xs font-medium border border-neon/20 capitalize">
                                {profile.fitness_level}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-electric/10 text-electric text-xs font-medium border border-electric/20 capitalize">
                                {profile.subscription} Plan
                            </span>
                            <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs border border-white/10">
                                {profile.role}
                            </span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-black text-neon">{profile.streak_count}</p>
                            <p className="text-xs text-gray-500">Streak</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-electric">{profile.total_workouts}</p>
                            <p className="text-xs text-gray-500">Workouts</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-white">{profile.badges_earned}</p>
                            <p className="text-xs text-gray-500">Badges</p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Body Stats & XP */}
            <div className="grid md:grid-cols-3 gap-6">
                <GlassCard delay={0.2} className="p-6">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Body Stats</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Age', value: `${profile.age || '—'} years`, icon: '🎂' },
                            { label: 'Weight', value: `${profile.weight || '—'} kg`, icon: '⚖️' },
                            { label: 'Height', value: `${profile.height || '—'} cm`, icon: '📏' },
                            { label: 'Gender', value: profile.gender || '—', icon: '👤' },
                        ].map((stat) => (
                            <div key={stat.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all">
                                <span className="text-sm text-gray-300 flex items-center gap-2"><span>{stat.icon}</span>{stat.label}</span>
                                <span className="text-sm font-medium text-white capitalize">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                <GlassCard delay={0.3} className="p-6 flex flex-col items-center justify-center">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Level & XP</h3>
                    {xp && (
                        <>
                            <ProgressRing progress={xp.xp_progress_percent} size={130} color="#00FF88"
                                value={`Lv ${xp.level}`} unit={`${xp.total_xp} XP`} />
                            <p className="mt-3 text-xs text-gray-500">{xp.xp_progress} / 100 XP to next level</p>
                        </>
                    )}
                </GlassCard>

                <GlassCard delay={0.4} className="p-6 flex flex-col items-center justify-center">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Streak</h3>
                    {streak && (
                        <>
                            <div className="text-5xl font-black text-neon glow-neon">{streak.current_streak}</div>
                            <p className="text-sm text-gray-400 mt-2">{streak.streak_description}</p>
                            <p className="text-xs text-gray-600 mt-2">❄️ Freezes: {streak.freeze_available}</p>
                        </>
                    )}
                </GlassCard>
            </div>

            {/* Badges */}
            <GlassCard delay={0.5} className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Badges ({earnedBadges.length} / {badges.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {earnedBadges.map((badge, i) => (
                        <motion.div
                            key={badge.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                            className="p-4 rounded-xl bg-neon/5 border border-neon/20 text-center hover:bg-neon/10 transition-all"
                        >
                            <span className="text-3xl">{badge.icon}</span>
                            <p className="text-sm font-medium text-white mt-2">{badge.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                            <p className="text-xs text-neon mt-1">+{badge.xp_reward} XP</p>
                        </motion.div>
                    ))}
                    {unearnedBadges.map((badge, i) => (
                        <div key={badge.id} className="p-4 rounded-xl bg-white/3 border border-white/5 text-center opacity-40">
                            <span className="text-3xl grayscale">{badge.icon}</span>
                            <p className="text-sm font-medium text-gray-500 mt-2">{badge.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                            <p className="text-xs text-gray-600 mt-1">🔒 Locked</p>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
