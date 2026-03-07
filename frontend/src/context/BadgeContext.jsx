/**
 * BadgeContext — Manages badge unlock state across the app
 * When a new badge is earned (from API response), it queues the celebration overlay.
 */
import { createContext, useContext, useState, useCallback } from 'react';

const BadgeContext = createContext(null);

export function BadgeProvider({ children }) {
    const [unlockedBadge, setUnlockedBadge] = useState(null);
    const [queue, setQueue] = useState([]);

    const showBadgeUnlock = useCallback((badges) => {
        if (!badges || badges.length === 0) return;
        setQueue(prev => [...prev, ...badges]);
        if (!unlockedBadge) {
            setUnlockedBadge(badges[0]);
        }
    }, [unlockedBadge]);

    const dismissBadge = useCallback(() => {
        setQueue(prev => {
            const remaining = prev.slice(1);
            if (remaining.length > 0) {
                setTimeout(() => setUnlockedBadge(remaining[0]), 300);
            } else {
                setUnlockedBadge(null);
            }
            return remaining;
        });
    }, []);

    return (
        <BadgeContext.Provider value={{ unlockedBadge, showBadgeUnlock, dismissBadge }}>
            {children}
        </BadgeContext.Provider>
    );
}

export function useBadge() {
    const ctx = useContext(BadgeContext);
    if (!ctx) throw new Error('useBadge must be used within BadgeProvider');
    return ctx;
}
