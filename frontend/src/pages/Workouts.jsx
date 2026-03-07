/**
 * Workouts Page — Exercise library with filters and workout logging
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';

const typeColors = {
    strength: '#00FF88', cardio: '#FF6B35', hiit: '#FF4757', yoga: '#A855F7', stretching: '#00C8FF'
};
const typeIcons = {
    strength: '🏋️', cardio: '🏃', hiit: '⚡', yoga: '🧘', stretching: '🤸'
};
const intensityColors = {
    low: 'text-green-400 bg-green-500/10 border-green-500/20',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    high: 'text-red-400 bg-red-500/10 border-red-500/20'
};

export default function Workouts() {
    const { apiFetch } = useAuth();
    const [exercises, setExercises] = useState([]);
    const [filters, setFilters] = useState({ type: '', muscle_group: '', intensity: '', search: '' });
    const [muscleGroups, setMuscleGroups] = useState([]);
    const [selected, setSelected] = useState(null);
    const [showLog, setShowLog] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => { fetchExercises(); fetchMuscleGroups(); fetchStats(); }, []);

    const fetchExercises = async (params = {}) => {
        const query = new URLSearchParams({ ...filters, ...params });
        const res = await apiFetch(`/api/workouts/exercises?${query}`);
        setExercises(await res.json());
    };

    const fetchMuscleGroups = async () => {
        const res = await apiFetch('/api/workouts/muscle-groups');
        setMuscleGroups(await res.json());
    };

    const fetchStats = async () => {
        const res = await apiFetch('/api/workouts/stats');
        setStats(await res.json());
    };

    const applyFilter = (key, value) => {
        const newFilters = { ...filters, [key]: filters[key] === value ? '' : value };
        setFilters(newFilters);
        fetchExercises(newFilters);
    };

    const logWorkout = async () => {
        if (!selected) return;
        try {
            await apiFetch('/api/workouts/log', {
                method: 'POST',
                body: JSON.stringify({
                    exercise_id: selected.id,
                    duration_minutes: parseInt(document.getElementById('wDuration')?.value) || 30,
                    calories_burned: parseInt(document.getElementById('wCalories')?.value) || Math.round(selected.calories_per_minute * 30),
                    activity_type: selected.type,
                })
            });
            setShowLog(false);
            fetchStats();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-black text-white">Workouts</h1>
                <p className="text-gray-400 mt-1">Browse exercises and log your workouts 🏋️</p>
            </motion.div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Workouts', value: stats.total_workouts, icon: '🏋️' },
                        { label: 'Calories Burned', value: `${stats.total_calories}`, icon: '🔥' },
                        { label: 'Active Minutes', value: `${stats.total_minutes}`, icon: '⏱️' },
                    ].map((s, i) => (
                        <GlassCard key={s.label} delay={i * 0.1} className="p-4 text-center">
                            <span className="text-xl">{s.icon}</span>
                            <p className="text-2xl font-black text-white mt-1">{s.value}</p>
                            <p className="text-xs text-gray-500">{s.label}</p>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Filters */}
            <GlassCard delay={0.2} className="p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                    <input
                        type="text"
                        placeholder="🔍 Search exercises..."
                        className="input-glass flex-1 min-w-[200px] !py-2 text-sm"
                        value={filters.search}
                        onChange={e => { setFilters({ ...filters, search: e.target.value }); fetchExercises({ ...filters, search: e.target.value }); }}
                    />
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs text-gray-500 w-full">Type:</span>
                    {Object.keys(typeIcons).map(type => (
                        <button key={type} onClick={() => applyFilter('type', type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize border
                ${filters.type === type ? 'border-neon/50 bg-neon/10 text-neon' : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'}`}>
                            {typeIcons[type]} {type}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500 w-full">Muscle:</span>
                    {muscleGroups.map(mg => (
                        <button key={mg} onClick={() => applyFilter('muscle_group', mg)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize border
                ${filters.muscle_group === mg ? 'border-electric/50 bg-electric/10 text-electric' : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'}`}>
                            {mg}
                        </button>
                    ))}
                </div>
            </GlassCard>

            {/* Exercise Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exercises.map((ex, i) => (
                    <GlassCard key={ex.id} delay={0.1 + i * 0.03} hover className="p-5" onClick={() => { setSelected(ex); setShowLog(true); }}>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <span className="text-2xl">{typeIcons[ex.type] || '🏋️'}</span>
                                <h4 className="text-base font-bold text-white mt-1">{ex.name}</h4>
                            </div>
                            <span className={`px-2 py-0.5 text-xs rounded-full border capitalize ${intensityColors[ex.intensity]}`}>
                                {ex.intensity}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{ex.instructions}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="capitalize">📍 {ex.muscle_group}</span>
                            <span>🔥 {ex.calories_per_minute} cal/min</span>
                            {ex.sets && ex.reps && <span>📋 {ex.sets}×{ex.reps}</span>}
                        </div>
                    </GlassCard>
                ))}
            </div>

            {exercises.length === 0 && (
                <div className="text-center text-gray-500 py-12">No exercises found matching your filters.</div>
            )}

            {/* Log Workout Modal */}
            <AnimatePresence>
                {showLog && selected && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowLog(false)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()} className="glass-card w-full max-w-md p-6">
                            <h3 className="text-xl font-bold text-white mb-1">{selected.name}</h3>
                            <p className="text-sm text-gray-400 mb-4">{selected.instructions}</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Duration (minutes)</label>
                                    <input type="number" defaultValue={30} className="input-glass" id="wDuration" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Calories Burned</label>
                                    <input type="number" defaultValue={Math.round(selected.calories_per_minute * 30)} className="input-glass" id="wCalories" />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowLog(false)} className="btn-glass flex-1">Cancel</button>
                                    <button onClick={logWorkout} className="btn-neon flex-1 text-center">Log Workout 🏋️</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
