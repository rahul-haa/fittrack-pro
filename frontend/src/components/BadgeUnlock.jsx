/**
 * BadgeUnlock — Full-screen celebration overlay with confetti and badge animation
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useBadge } from '../context/BadgeContext';

function Confetti() {
    const [particles] = useState(() =>
        Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 0.5,
            duration: 2 + Math.random() * 2,
            size: 4 + Math.random() * 8,
            color: ['#00FF88', '#00C8FF', '#FF6B35', '#A855F7', '#FFD700', '#FF4757'][Math.floor(Math.random() * 6)],
            rotation: Math.random() * 360,
        }))
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute"
                    style={{
                        left: `${p.x}%`,
                        top: '-5%',
                        width: p.size,
                        height: p.size * 1.5,
                        backgroundColor: p.color,
                        borderRadius: '2px',
                    }}
                    initial={{ y: -20, rotate: 0, opacity: 1 }}
                    animate={{
                        y: '120vh',
                        rotate: p.rotation + 720,
                        opacity: [1, 1, 0.8, 0],
                    }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        ease: 'easeIn',
                    }}
                />
            ))}
        </div>
    );
}

export default function BadgeUnlock() {
    const { unlockedBadge, dismissBadge } = useBadge();
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        if (unlockedBadge) {
            setFlash(true);
            setTimeout(() => setFlash(false), 300);
        }
    }, [unlockedBadge]);

    return (
        <AnimatePresence>
            {unlockedBadge && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    onClick={dismissBadge}
                >
                    {/* Background */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

                    {/* Flash */}
                    {flash && (
                        <motion.div
                            className="absolute inset-0 bg-neon/20"
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        />
                    )}

                    {/* Confetti */}
                    <Confetti />

                    {/* Badge Card */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 150 }}
                        className="relative z-10 text-center"
                    >
                        {/* Glow ring */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: 'radial-gradient(circle, rgba(0,255,136,0.3) 0%, transparent 70%)',
                                width: '300px',
                                height: '300px',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.5, 0.8, 0.5],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />

                        {/* Badge icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring', damping: 8 }}
                            className="text-8xl mb-6 relative z-10"
                            style={{ filter: 'drop-shadow(0 0 30px rgba(0,255,136,0.6))' }}
                        >
                            {unlockedBadge.icon}
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <p className="text-sm uppercase tracking-widest text-neon font-bold mb-2">🏆 Badge Unlocked!</p>
                            <h2 className="text-3xl font-black text-white mb-2">{unlockedBadge.name}</h2>
                            <p className="text-gray-400 text-sm mb-4 max-w-xs mx-auto">{unlockedBadge.description}</p>

                            {/* XP Reward */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.8, type: 'spring' }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon/10 border border-neon/30"
                            >
                                <span className="text-neon font-bold">+{unlockedBadge.xp_reward} XP</span>
                            </motion.div>
                        </motion.div>

                        {/* Dismiss hint */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                            className="text-gray-600 text-xs mt-8"
                        >
                            Tap anywhere to continue
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
