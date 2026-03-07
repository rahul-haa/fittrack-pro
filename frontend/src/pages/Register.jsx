/**
 * Register Page — Multi-step onboarding flow
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const steps = ['Account', 'Personal', 'Fitness'];

export default function Register() {
    const [step, setStep] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '', password: '', name: '',
        age: '', weight: '', height: '', gender: 'male', fitness_level: 'beginner'
    });

    const update = (field, value) => setForm({ ...form, [field]: value });

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await register({
                ...form,
                age: parseInt(form.age) || null,
                weight: parseFloat(form.weight) || null,
                height: parseFloat(form.height) || null,
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const next = () => {
        if (step === 0 && (!form.email || !form.password || !form.name)) {
            setError('Please fill all fields'); return;
        }
        setError('');
        if (step < 2) setStep(step + 1);
        else handleSubmit();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="bg-glow w-[400px] h-[400px] bg-electric/20 top-1/4 -right-20" />
            <div className="bg-glow w-[300px] h-[300px] bg-neon/20 bottom-1/3 -left-10" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card w-full max-w-md p-8 relative z-10"
            >
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-black text-gradient mb-1">Join FitTrack</h1>
                    <p className="text-gray-400 text-sm">Step {step + 1} of 3 — {steps[step]}</p>
                </div>

                {/* Progress bar */}
                <div className="flex gap-2 mb-6">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-gradient-to-r from-neon to-electric' : 'bg-white/10'}`} />
                    ))}
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        {step === 0 && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                                    <input type="text" value={form.name} onChange={e => update('name', e.target.value)} className="input-glass" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input-glass" placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                                    <input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="input-glass" placeholder="Min. 6 characters" />
                                </div>
                            </>
                        )}

                        {step === 1 && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Age</label>
                                        <input type="number" value={form.age} onChange={e => update('age', e.target.value)} className="input-glass" placeholder="28" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Gender</label>
                                        <select value={form.gender} onChange={e => update('gender', e.target.value)} className="input-glass">
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Weight (kg)</label>
                                        <input type="number" value={form.weight} onChange={e => update('weight', e.target.value)} className="input-glass" placeholder="75" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Height (cm)</label>
                                        <input type="number" value={form.height} onChange={e => update('height', e.target.value)} className="input-glass" placeholder="178" />
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <label className="block text-sm font-medium text-gray-300 mb-3">Fitness Level</label>
                                <div className="space-y-3">
                                    {[
                                        { value: 'beginner', label: 'Beginner', desc: 'Just starting my fitness journey', icon: '🌱' },
                                        { value: 'intermediate', label: 'Intermediate', desc: 'I work out 2-4 times a week', icon: '💪' },
                                        { value: 'advanced', label: 'Advanced', desc: 'I train 5+ times a week', icon: '🔥' },
                                    ].map((level) => (
                                        <button
                                            key={level.value}
                                            onClick={() => update('fitness_level', level.value)}
                                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4
                        ${form.fitness_level === level.value
                                                    ? 'border-neon/50 bg-neon/10 shadow-neon'
                                                    : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                                        >
                                            <span className="text-2xl">{level.icon}</span>
                                            <div>
                                                <p className="font-semibold text-white">{level.label}</p>
                                                <p className="text-xs text-gray-400">{level.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>

                <div className="mt-6 flex gap-3">
                    {step > 0 && (
                        <button onClick={() => setStep(step - 1)} className="btn-glass flex-1">← Back</button>
                    )}
                    <button onClick={next} disabled={loading} className="btn-neon flex-1 text-center">
                        {loading ? '⏳ Creating...' : step === 2 ? '🚀 Start Journey' : 'Continue →'}
                    </button>
                </div>

                <p className="mt-4 text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-neon hover:text-neon-dim transition-colors font-medium">Sign In</Link>
                </p>
            </motion.div>
        </div>
    );
}
