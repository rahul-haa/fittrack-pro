/**
 * AI Coach — Personalized workout and meal plan generator
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';

const focusOptions = [
    { value: 'balanced', label: 'Balanced', icon: '⚖️', desc: 'Mix of strength, cardio & flexibility' },
    { value: 'strength', label: 'Strength', icon: '💪', desc: 'Build muscle and power' },
    { value: 'cardio', label: 'Cardio', icon: '🏃', desc: 'Improve endurance and heart health' },
    { value: 'flexibility', label: 'Flexibility', icon: '🧘', desc: 'Yoga and stretching' },
];

const goalOptions = [
    { value: 'lose', label: 'Lose Weight', icon: '📉' },
    { value: 'maintain', label: 'Maintain', icon: '⚖️' },
    { value: 'gain', label: 'Build Muscle', icon: '📈' },
];

const typeColors = {
    strength: 'from-green-500/20 to-green-600/10 border-green-500/30',
    cardio: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    hiit: 'from-red-500/20 to-red-600/10 border-red-500/30',
    yoga: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    stretching: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    rest: 'from-gray-500/20 to-gray-600/10 border-gray-500/30',
};

export default function AICoach() {
    const { apiFetch } = useAuth();
    const [tab, setTab] = useState('workout');
    const [workoutPlan, setWorkoutPlan] = useState(null);
    const [mealPlan, setMealPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedDay, setSelectedDay] = useState(0);

    // Workout settings
    const [focus, setFocus] = useState('balanced');
    const [days, setDays] = useState(5);
    const [duration, setDuration] = useState(45);

    // Meal settings
    const [calories, setCalories] = useState(2000);
    const [mealGoal, setMealGoal] = useState('maintain');

    const generateWorkout = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/ai/generate-workout', {
                method: 'POST',
                body: JSON.stringify({ days, focus, duration_minutes: duration }),
            });
            setWorkoutPlan(await res.json());
            setSelectedDay(0);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const generateMeal = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/ai/generate-meal', {
                method: 'POST',
                body: JSON.stringify({ daily_calories: calories, goal: mealGoal }),
            });
            setMealPlan(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-black text-white">AI Coach</h1>
                <p className="text-gray-400 mt-1">Personalized plans powered by AI 🤖</p>
            </motion.div>

            {/* Tab Toggle */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                {[{ k: 'workout', l: '🏋️ Workout Plan' }, { k: 'meal', l: '🥗 Meal Plan' }].map(t => (
                    <button key={t.k} onClick={() => setTab(t.k)}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${tab === t.k ? 'bg-neon/15 text-neon border border-neon/30' : 'text-gray-400 hover:text-white'}`}>{t.l}</button>
                ))}
            </div>

            {/* Workout Tab */}
            {tab === 'workout' && (
                <div className="space-y-6">
                    {/* Config */}
                    <GlassCard delay={0.1} className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Configure Your Plan</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Workout Focus</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {focusOptions.map(f => (
                                        <button key={f.value} onClick={() => setFocus(f.value)}
                                            className={`p-3 rounded-xl text-left text-sm border transition-all
                        ${focus === f.value ? 'border-neon/50 bg-neon/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                                            <span className="text-xl">{f.icon}</span>
                                            <p className="font-semibold text-white mt-1">{f.label}</p>
                                            <p className="text-xs text-gray-500">{f.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Days per Week</label>
                                    <div className="flex gap-1">
                                        {[3, 4, 5, 6].map(d => (
                                            <button key={d} onClick={() => setDays(d)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all
                          ${days === d ? 'border-neon/50 bg-neon/10 text-neon' : 'border-white/10 bg-white/5 text-gray-400'}`}>{d}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Duration (min)</label>
                                    <div className="flex gap-1">
                                        {[30, 45, 60, 90].map(d => (
                                            <button key={d} onClick={() => setDuration(d)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all
                          ${duration === d ? 'border-electric/50 bg-electric/10 text-electric' : 'border-white/10 bg-white/5 text-gray-400'}`}>{d}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button onClick={generateWorkout} disabled={loading} className="btn-neon w-full text-center">
                                {loading ? '⏳ Generating...' : '🤖 Generate Workout Plan'}
                            </button>
                        </div>
                    </GlassCard>

                    {/* Generated Plan */}
                    <AnimatePresence mode="wait">
                        {workoutPlan && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                {/* Day Selector */}
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                    {workoutPlan.weekly_plan.map((day, i) => (
                                        <button key={i} onClick={() => setSelectedDay(i)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium border whitespace-nowrap transition-all
                        ${selectedDay === i ? 'border-neon/50 bg-neon/10 text-neon' : 'border-white/10 bg-white/5 text-gray-400'}`}>
                                            {day.day.slice(0, 3)} {day.type === 'rest' ? '😴' : ''}
                                        </button>
                                    ))}
                                </div>

                                {/* Day Detail */}
                                {workoutPlan.weekly_plan[selectedDay] && (
                                    <GlassCard className="p-6">
                                        {workoutPlan.weekly_plan[selectedDay].type === 'rest' ? (
                                            <div className="text-center py-8">
                                                <span className="text-5xl mb-4 block">😴</span>
                                                <h3 className="text-xl font-bold text-white">Rest Day</h3>
                                                <p className="text-gray-400 text-sm mt-2">Recovery is just as important as training!</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-white capitalize">{workoutPlan.weekly_plan[selectedDay].day} — {workoutPlan.weekly_plan[selectedDay].type}</h3>
                                                        <p className="text-sm text-gray-400">{workoutPlan.weekly_plan[selectedDay].total_duration} min · ~{workoutPlan.weekly_plan[selectedDay].estimated_calories} cal</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    {workoutPlan.weekly_plan[selectedDay].exercises.map((ex, i) => (
                                                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                                            className={`p-4 rounded-xl border bg-gradient-to-r ${typeColors[ex.type] || typeColors.strength}`}>
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <h4 className="font-semibold text-white">{ex.name}</h4>
                                                                    <p className="text-xs text-gray-400 capitalize">{ex.muscle_group} · {ex.type}</p>
                                                                </div>
                                                                <div className="text-right text-xs text-gray-400">
                                                                    <p>{ex.sets} × {ex.reps}</p>
                                                                    <p>{ex.duration_minutes} min</p>
                                                                </div>
                                                            </div>
                                                            {ex.instructions && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{ex.instructions}</p>}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </GlassCard>
                                )}

                                {/* Tips */}
                                <GlassCard delay={0.2} className="p-5 mt-4">
                                    <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">AI Tips for You</h4>
                                    <div className="space-y-2">
                                        {workoutPlan.tips?.map((tip, i) => (
                                            <p key={i} className="text-sm text-gray-300">{tip}</p>
                                        ))}
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Meal Tab */}
            {tab === 'meal' && (
                <div className="space-y-6">
                    <GlassCard delay={0.1} className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Meal Plan Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Goal</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {goalOptions.map(g => (
                                        <button key={g.value} onClick={() => setMealGoal(g.value)}
                                            className={`p-3 rounded-xl text-center text-sm border transition-all
                        ${mealGoal === g.value ? 'border-neon/50 bg-neon/10' : 'border-white/10 bg-white/5'}`}>
                                            <span className="text-xl">{g.icon}</span>
                                            <p className="font-medium text-white mt-1">{g.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Daily Calories Target</label>
                                <input type="number" value={calories} onChange={e => setCalories(parseInt(e.target.value) || 2000)} className="input-glass" />
                            </div>
                            <button onClick={generateMeal} disabled={loading} className="btn-neon w-full text-center">
                                {loading ? '⏳ Generating...' : '🤖 Generate Meal Plan'}
                            </button>
                        </div>
                    </GlassCard>

                    {mealPlan && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { l: 'Calories', v: mealPlan.total_calories, u: 'kcal', c: '#FF6B35' },
                                    { l: 'Protein', v: `${mealPlan.target_macros.protein}g`, c: '#00FF88' },
                                    { l: 'Carbs', v: `${mealPlan.target_macros.carbs}g`, c: '#00C8FF' },
                                    { l: 'Fats', v: `${mealPlan.target_macros.fats}g`, c: '#A855F7' },
                                ].map((s, i) => (
                                    <GlassCard key={s.l} delay={i * 0.08} className="p-3 text-center">
                                        <p className="text-lg font-black" style={{ color: s.c }}>{s.v}</p>
                                        <p className="text-xs text-gray-500">{s.l}</p>
                                    </GlassCard>
                                ))}
                            </div>

                            {/* Meals */}
                            {mealPlan.meals.map((meal, i) => (
                                <GlassCard key={meal.meal_type} delay={0.2 + i * 0.1} className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-bold text-white capitalize flex items-center gap-2">
                                            <span>{{ breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }[meal.meal_type]}</span>
                                            {meal.meal_type}
                                        </h4>
                                        <span className="text-sm text-gray-400">{meal.total_calories} cal</span>
                                    </div>
                                    <div className="space-y-2">
                                        {meal.items.map((item, j) => (
                                            <div key={j} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                                <div>
                                                    <p className="text-sm font-medium text-white">{item.name}</p>
                                                    <p className="text-xs text-gray-500">P:{item.protein}g · C:{item.carbs}g · F:{item.fats}g</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-neon font-semibold">{item.calories} cal</p>
                                                    <p className="text-xs text-gray-600">{item.servings} serving{item.servings !== 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            ))}

                            {/* Meal Tips */}
                            <GlassCard className="p-5">
                                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Nutrition Tips</h4>
                                <div className="space-y-2">
                                    {mealPlan.tips?.map((tip, i) => (
                                        <p key={i} className="text-sm text-gray-300">{tip}</p>
                                    ))}
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}
