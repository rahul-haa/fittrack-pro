/**
 * Goals Page — Set, edit, and track fitness goals with progress rings
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import ProgressRing from '../components/ProgressRing';

const goalTypes = [
    { type: 'weight_loss', label: 'Weight Loss', icon: '⚖️', unit: 'kg', color: '#FF6B35' },
    { type: 'muscle_gain', label: 'Muscle Gain', icon: '💪', unit: 'kg', color: '#00FF88' },
    { type: 'daily_steps', label: 'Daily Steps', icon: '👟', unit: 'steps', color: '#00C8FF' },
    { type: 'calorie_target', label: 'Calorie Target', icon: '🔥', unit: 'kcal', color: '#FF4757' },
    { type: 'water_intake', label: 'Water Intake', icon: '💧', unit: 'ml', color: '#00C8FF' },
    { type: 'sleep_hours', label: 'Sleep Hours', icon: '😴', unit: 'hours', color: '#A855F7' },
];

export default function Goals() {
    const { apiFetch } = useAuth();
    const [goals, setGoals] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newGoal, setNewGoal] = useState({ type: 'daily_steps', target_value: '', unit: 'steps', period: 'daily' });

    useEffect(() => { fetchGoals(); }, []);

    const fetchGoals = async () => {
        try {
            const res = await apiFetch('/api/goals');
            setGoals(await res.json());
        } catch (err) { console.error(err); }
    };

    const addGoal = async () => {
        if (!newGoal.target_value) return;
        const typeInfo = goalTypes.find(g => g.type === newGoal.type);
        try {
            await apiFetch('/api/goals', {
                method: 'POST',
                body: JSON.stringify({ ...newGoal, unit: typeInfo?.unit || 'units' })
            });
            setShowAdd(false);
            setNewGoal({ type: 'daily_steps', target_value: '', unit: 'steps', period: 'daily' });
            fetchGoals();
        } catch (err) { console.error(err); }
    };

    const deleteGoal = async (id) => {
        try {
            await apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
            fetchGoals();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white">Goals</h1>
                    <p className="text-gray-400 mt-1">Track your progress and crush your goals 🎯</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="btn-neon text-sm">+ Add Goal</button>
            </motion.div>

            {/* Goals Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal, i) => {
                    const typeInfo = goalTypes.find(g => g.type === goal.type) || { icon: '🎯', color: '#00FF88' };
                    return (
                        <GlassCard key={goal.id} delay={i * 0.1} hover className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{typeInfo.icon}</span>
                                    <span className="font-semibold text-white capitalize">{goal.type.replace('_', ' ')}</span>
                                </div>
                                <button onClick={() => deleteGoal(goal.id)} className="text-gray-600 hover:text-red-400 transition-colors text-sm">✕</button>
                            </div>
                            <div className="flex justify-center my-4">
                                <ProgressRing progress={goal.progress_percent || 0} size={120} color={typeInfo.color}
                                    value={`${Math.round(goal.progress_percent || 0)}%`} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-400">
                                    {goal.current_value} / {goal.target_value} {goal.unit}
                                </p>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500 capitalize">{goal.period}</span>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>

            {goals.length === 0 && (
                <GlassCard className="p-12 text-center">
                    <span className="text-5xl mb-4 block">🎯</span>
                    <h3 className="text-xl font-bold text-white mb-2">No Goals Yet</h3>
                    <p className="text-gray-400 mb-4">Set your first fitness goal to start tracking progress</p>
                    <button onClick={() => setShowAdd(true)} className="btn-neon">Set First Goal</button>
                </GlassCard>
            )}

            {/* Add Goal Modal */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()} className="glass-card w-full max-w-md p-6">
                            <h3 className="text-xl font-bold text-white mb-4">Add New Goal</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Goal Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {goalTypes.map(gt => (
                                            <button key={gt.type} onClick={() => setNewGoal({ ...newGoal, type: gt.type, unit: gt.unit })}
                                                className={`p-3 rounded-xl text-left text-sm border transition-all flex items-center gap-2
                          ${newGoal.type === gt.type ? 'border-neon/50 bg-neon/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                                                <span>{gt.icon}</span> {gt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Target Value</label>
                                    <input type="number" value={newGoal.target_value} onChange={e => setNewGoal({ ...newGoal, target_value: parseFloat(e.target.value) })}
                                        className="input-glass" placeholder={`e.g., ${goalTypes.find(g => g.type === newGoal.type)?.type === 'daily_steps' ? '10000' : '75'}`} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Period</label>
                                    <select value={newGoal.period} onChange={e => setNewGoal({ ...newGoal, period: e.target.value })} className="input-glass">
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowAdd(false)} className="btn-glass flex-1">Cancel</button>
                                    <button onClick={addGoal} className="btn-neon flex-1 text-center">Create Goal</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
