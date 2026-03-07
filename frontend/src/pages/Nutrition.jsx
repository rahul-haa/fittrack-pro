/**
 * Nutrition Page — Food logging, macros, and meal tracking
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';

const mealIcons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
const MACRO_COLORS = ['#00FF88', '#00C8FF', '#FF6B35', '#A855F7'];

export default function Nutrition() {
    const { apiFetch } = useAuth();
    const [todayData, setTodayData] = useState(null);
    const [foods, setFoods] = useState([]);
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState([]);
    const [showLog, setShowLog] = useState(null);
    const [logMeal, setLogMeal] = useState('lunch');

    useEffect(() => { fetchToday(); fetchCategories(); }, []);

    const fetchToday = async () => {
        const res = await apiFetch('/api/nutrition/today');
        setTodayData(await res.json());
    };

    const fetchCategories = async () => {
        const res = await apiFetch('/api/nutrition/categories');
        setCategories(await res.json());
    };

    const searchFoods = async (q) => {
        setSearch(q);
        if (q.length < 2) { setFoods([]); return; }
        const res = await apiFetch(`/api/nutrition/foods?search=${encodeURIComponent(q)}`);
        setFoods(await res.json());
    };

    const logFood = async (food) => {
        try {
            await apiFetch('/api/nutrition/log', {
                method: 'POST',
                body: JSON.stringify({ food_item_id: food.id, meal_type: logMeal, servings: 1 })
            });
            fetchToday();
            setShowLog(null);
            setFoods([]);
            setSearch('');
        } catch (err) { console.error(err); }
    };

    const totals = todayData?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };

    const macroData = [
        { name: 'Protein', value: totals.protein, color: '#00FF88' },
        { name: 'Carbs', value: totals.carbs, color: '#00C8FF' },
        { name: 'Fats', value: totals.fats, color: '#FF6B35' },
        { name: 'Fiber', value: totals.fiber, color: '#A855F7' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-black text-white">Nutrition</h1>
                <p className="text-gray-400 mt-1">Track your calories and macros 🥗</p>
            </motion.div>

            {/* Today's Summary */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Macro Donut */}
                <GlassCard delay={0.1} className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Macros Today</h3>
                    <div className="flex items-center gap-6">
                        <div className="w-40 h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={macroData.length > 0 ? macroData : [{ name: 'No data', value: 1, color: '#333' }]}
                                        cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                        {(macroData.length > 0 ? macroData : [{ color: '#333' }]).map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'rgba(10,14,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Protein', value: `${Math.round(totals.protein)}g`, color: '#00FF88' },
                                { label: 'Carbs', value: `${Math.round(totals.carbs)}g`, color: '#00C8FF' },
                                { label: 'Fats', value: `${Math.round(totals.fats)}g`, color: '#FF6B35' },
                                { label: 'Fiber', value: `${Math.round(totals.fiber)}g`, color: '#A855F7' },
                            ].map(m => (
                                <div key={m.label} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                                    <span className="text-sm text-gray-400">{m.label}</span>
                                    <span className="text-sm font-semibold text-white ml-auto">{m.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <span className="text-3xl font-black text-white">{Math.round(totals.calories)}</span>
                        <span className="text-sm text-gray-400 ml-2">kcal today</span>
                    </div>
                </GlassCard>

                {/* Quick Food Log */}
                <GlassCard delay={0.2} className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Log Food</h3>
                    <div className="flex gap-2 mb-3">
                        {Object.entries(mealIcons).map(([meal, icon]) => (
                            <button key={meal} onClick={() => setLogMeal(meal)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-all
                  ${logMeal === meal ? 'border-neon/50 bg-neon/10 text-neon' : 'border-white/10 bg-white/5 text-gray-400'}`}>
                                {icon} {meal}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={e => searchFoods(e.target.value)}
                        className="input-glass mb-3"
                        placeholder="🔍 Search foods..."
                    />
                    {foods.length > 0 && (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {foods.map(food => (
                                <motion.button
                                    key={food.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => logFood(food)}
                                    className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-neon/30 transition-all"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium text-white">{food.name}</p>
                                            <p className="text-xs text-gray-500">P: {food.protein}g | C: {food.carbs}g | F: {food.fats}g</p>
                                        </div>
                                        <span className="text-sm font-bold text-neon">{food.calories} cal</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Meals Today */}
            <GlassCard delay={0.3} className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Today's Meals</h3>
                {todayData?.logs?.length > 0 ? (
                    <div className="space-y-3">
                        {Object.entries(todayData.by_meal || {}).map(([meal, logs]) => (
                            <div key={meal}>
                                <h4 className="text-sm font-semibold text-gray-400 capitalize mb-2 flex items-center gap-2">
                                    <span>{mealIcons[meal]}</span> {meal}
                                </h4>
                                {logs.map(log => (
                                    <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 mb-1">
                                        <span className="text-sm text-white">{log.food_name || 'Custom food'}</span>
                                        <span className="text-sm text-gray-400">{Math.round(log.calories)} cal</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm text-center py-8">No meals logged today. Search for food above to get started!</p>
                )}
            </GlassCard>
        </div>
    );
}
