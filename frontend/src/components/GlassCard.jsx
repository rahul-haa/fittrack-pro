/**
 * GlassCard — Reusable glassmorphism card component
 */
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = false, delay = 0, onClick }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
            onClick={onClick}
            className={`${hover ? 'glass-card-hover cursor-pointer' : 'glass-card'} ${className}`}
        >
            {children}
        </motion.div>
    );
}
