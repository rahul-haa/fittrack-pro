/**
 * WaterWave — CSS animated water bottle with wave fill-level
 * The hero visual for the water tracker feature.
 */
import { motion } from 'framer-motion';

export default function WaterWave({ percentage = 0, size = 200 }) {
    const clampedPercent = Math.min(100, Math.max(0, percentage));
    const fillHeight = (clampedPercent / 100) * 100;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size * 1.3 }}>
            {/* Bottle shape */}
            <div
                className="relative overflow-hidden rounded-3xl border-2 border-white/20"
                style={{
                    width: size * 0.65,
                    height: size * 1.1,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 100%)',
                    borderRadius: '20px 20px 30px 30px',
                }}
            >
                {/* Bottle neck */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white/20 rounded-t-lg"
                    style={{
                        width: size * 0.3,
                        height: size * 0.12,
                        background: 'rgba(255,255,255,0.05)',
                    }}
                />

                {/* Water fill */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0"
                    initial={{ height: '0%' }}
                    animate={{ height: `${fillHeight}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{ overflow: 'hidden' }}
                >
                    {/* Wave layer 1 */}
                    <div className="absolute top-0 left-0 right-0" style={{ height: '20px', marginTop: '-10px' }}>
                        <svg viewBox="0 0 500 30" preserveAspectRatio="none" className="w-[200%] water-wave" style={{ height: '20px' }}>
                            <path
                                d="M0,15 Q62.5,0 125,15 T250,15 T375,15 T500,15 V30 H0 Z"
                                fill={clampedPercent > 80 ? '#00FF88' : '#00C8FF'}
                                opacity="0.8"
                            />
                        </svg>
                    </div>
                    {/* Wave layer 2 */}
                    <div className="absolute top-0 left-0 right-0" style={{ height: '20px', marginTop: '-5px' }}>
                        <svg viewBox="0 0 500 30" preserveAspectRatio="none" className="w-[200%] water-wave-2" style={{ height: '20px' }}>
                            <path
                                d="M0,15 Q62.5,30 125,15 T250,15 T375,15 T500,15 V30 H0 Z"
                                fill={clampedPercent > 80 ? '#00FF88' : '#00C8FF'}
                                opacity="0.4"
                            />
                        </svg>
                    </div>

                    {/* Water body */}
                    <div
                        className="w-full h-full"
                        style={{
                            background: clampedPercent > 80
                                ? 'linear-gradient(180deg, rgba(0,255,136,0.4) 0%, rgba(0,255,136,0.7) 100%)'
                                : 'linear-gradient(180deg, rgba(0,200,255,0.3) 0%, rgba(0,200,255,0.6) 100%)',
                            marginTop: '10px',
                        }}
                    />

                    {/* Bubbles */}
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full"
                            style={{
                                width: 4 + Math.random() * 6,
                                height: 4 + Math.random() * 6,
                                left: `${15 + Math.random() * 70}%`,
                                bottom: `${10 + Math.random() * 60}%`,
                                background: 'rgba(255,255,255,0.3)',
                            }}
                            animate={{
                                y: [0, -20, -40],
                                opacity: [0.6, 0.3, 0],
                            }}
                            transition={{
                                duration: 2 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 3,
                            }}
                        />
                    ))}
                </motion.div>
            </div>

            {/* Percentage label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.span
                    className="text-3xl font-black text-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    style={{ textShadow: '0 0 20px rgba(0,200,255,0.5)' }}
                >
                    {Math.round(clampedPercent)}%
                </motion.span>
                <span className="text-xs text-gray-400 mt-1">Hydrated</span>
            </div>
        </div>
    );
}
