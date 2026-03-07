import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';

export default function Social() {
    const { apiFetch } = useAuth();
    const [tab, setTab] = useState('feed');
    const [feed, setFeed] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [leaderboard, setLeaderboard] = useState(null);
    const [lbType, setLbType] = useState('xp');

    useEffect(() => { fetchAll(); }, []);
    useEffect(() => { fetchLeaderboard(); }, [lbType]);

    const fetchAll = async () => {
        const [f, c] = await Promise.all([
            apiFetch('/api/social/feed'), apiFetch('/api/social/challenges')
        ]);
        setFeed(await f.json()); setChallenges(await c.json()); fetchLeaderboard();
    };

    const fetchLeaderboard = async () => {
        const r = await apiFetch(`/api/gamification/leaderboard?type=${lbType}`);
        setLeaderboard(await r.json());
    };

    const joinChallenge = async (id) => {
        await apiFetch(`/api/social/challenges/${id}/join`, { method: 'POST' });
        const r = await apiFetch('/api/social/challenges');
        setChallenges(await r.json());
    };

    const likePost = async (id) => {
        await apiFetch(`/api/social/posts/${id}/like`, { method: 'POST' });
        const r = await apiFetch('/api/social/feed');
        setFeed(await r.json());
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-black text-white">Community</h1>
                <p className="text-gray-400 mt-1">Connect, compete, and grow together 👥</p>
            </motion.div>

            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                {[{ k: 'feed', l: '📰 Feed' }, { k: 'leaderboard', l: '🏆 Leaderboard' }, { k: 'challenges', l: '⚔️ Challenges' }].map(t => (
                    <button key={t.k} onClick={() => setTab(t.k)}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${tab === t.k ? 'bg-neon/15 text-neon border border-neon/30' : 'text-gray-400 hover:text-white'}`}>{t.l}</button>
                ))}
            </div>

            {tab === 'feed' && (
                <div className="space-y-4">
                    {feed.length > 0 ? feed.map((p, i) => (
                        <GlassCard key={p.id} delay={i * 0.07} className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon to-electric flex items-center justify-center text-black font-bold text-sm">{p.author_name?.charAt(0)}</div>
                                <div><p className="text-sm font-semibold text-white">{p.author_name}</p><p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p></div>
                            </div>
                            <p className="text-gray-300 text-sm mb-3">{p.content}</p>
                            <div className="flex gap-4">
                                <button onClick={() => likePost(p.id)} className={`text-sm ${p.user_liked ? 'text-neon' : 'text-gray-500'}`}>❤️ {p.likes_count}</button>
                                <span className="text-sm text-gray-500">💬 {p.comments_count}</span>
                            </div>
                        </GlassCard>
                    )) : <GlassCard className="p-12 text-center"><span className="text-4xl block mb-3">📰</span><p className="text-gray-400">No posts yet</p></GlassCard>}
                </div>
            )}

            {tab === 'leaderboard' && (
                <div>
                    <div className="flex gap-2 mb-4">
                        {['xp', 'steps', 'calories', 'workouts'].map(t => (
                            <button key={t} onClick={() => setLbType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize ${lbType === t ? 'border-neon/50 bg-neon/10 text-neon' : 'border-white/10 bg-white/5 text-gray-400'}`}>{t}</button>
                        ))}
                    </div>
                    <GlassCard className="p-6">
                        {leaderboard?.leaderboard?.map((e, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                className={`flex items-center gap-4 p-3 rounded-xl ${e.is_current_user ? 'bg-neon/5 border border-neon/30' : ''}`}>
                                <span className={`text-lg font-black w-8 text-center ${e.rank === 1 ? 'text-yellow-400' : e.rank === 2 ? 'text-gray-300' : e.rank === 3 ? 'text-orange-400' : 'text-gray-600'}`}>
                                    {e.rank <= 3 ? ['🥇', '🥈', '🥉'][e.rank - 1] : `#${e.rank}`}
                                </span>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon/50 to-electric/50 flex items-center justify-center text-xs font-bold text-white">{e.name?.charAt(0)}</div>
                                <span className="flex-1 text-sm font-medium text-white">{e.name} {e.is_current_user && <span className="text-neon text-xs">(You)</span>}</span>
                                <span className="text-sm font-bold text-neon">{e.value?.toLocaleString()}</span>
                            </motion.div>
                        ))}
                    </GlassCard>
                </div>
            )}

            {tab === 'challenges' && (
                <div className="grid md:grid-cols-2 gap-4">
                    {challenges.map((ch, i) => (
                        <GlassCard key={ch.id} delay={i * 0.1} hover className="p-6">
                            <h3 className="text-lg font-bold text-white mb-1">{ch.name}</h3>
                            <p className="text-sm text-gray-400 mb-4">{ch.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">👥 {ch.participants_count}</span>
                                {ch.user_joined ? <span className="px-3 py-1 rounded-full bg-neon/10 text-neon text-xs">✅ Joined</span>
                                    : <button onClick={() => joinChallenge(ch.id)} className="btn-neon !py-1.5 !px-4 text-xs">Join</button>}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
