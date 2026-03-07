/**
 * ProgressRing — Animated SVG circular progress ring
 */
import { motion } from 'framer-motion';

export default function ProgressRing({ progress = 0, size = 120, strokeWidth = 8, color = '#00FF88', label, value, unit }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress ring */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                {value !== undefined && (
                    <span className="text-xl font-bold text-white">{value}</span>
                )}
                {unit && <span className="text-xs text-gray-400">{unit}</span>}
                {label && !value && (
                    <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
                )}
                {label && <span className="text-xs text-gray-400 mt-1">{label}</span>}
            </div>
        </div>
    );
}
