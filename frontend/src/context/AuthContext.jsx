/**
 * Auth Context — JWT authentication state management
 * Provides login, register, logout, and auto token refresh.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const API = '/api';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load persisted auth state
    useEffect(() => {
        const stored = localStorage.getItem('fittrack_user');
        const token = localStorage.getItem('fittrack_token');
        if (stored && token) {
            setUser(JSON.parse(stored));
            // Validate the token by fetching profile
            fetch(`${API}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.ok ? r.json() : Promise.reject())
                .then(data => { setUser(data); localStorage.setItem('fittrack_user', JSON.stringify(data)); })
                .catch(() => {
                    // Try refresh
                    const refreshToken = localStorage.getItem('fittrack_refresh');
                    if (refreshToken) {
                        refreshAccessToken(refreshToken).catch(() => logout());
                    } else {
                        logout();
                    }
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const refreshAccessToken = useCallback(async (refreshToken) => {
        const res = await fetch(`${API}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        if (!res.ok) throw new Error('Refresh failed');
        const data = await res.json();
        localStorage.setItem('fittrack_token', data.accessToken);
        localStorage.setItem('fittrack_refresh', data.refreshToken);
        return data.accessToken;
    }, []);

    const login = useCallback(async (email, password) => {
        setError(null);
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        localStorage.setItem('fittrack_token', data.accessToken);
        localStorage.setItem('fittrack_refresh', data.refreshToken);
        localStorage.setItem('fittrack_user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
    }, []);

    const register = useCallback(async (userData) => {
        setError(null);
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        localStorage.setItem('fittrack_token', data.accessToken);
        localStorage.setItem('fittrack_refresh', data.refreshToken);
        localStorage.setItem('fittrack_user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
    }, []);

    const logout = useCallback(() => {
        const refreshToken = localStorage.getItem('fittrack_refresh');
        if (refreshToken) {
            fetch(`${API}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            }).catch(() => { });
        }
        localStorage.removeItem('fittrack_token');
        localStorage.removeItem('fittrack_refresh');
        localStorage.removeItem('fittrack_user');
        setUser(null);
    }, []);

    // API helper with auto-refresh
    const apiFetch = useCallback(async (url, options = {}) => {
        let token = localStorage.getItem('fittrack_token');
        const headers = { ...options.headers, Authorization: `Bearer ${token}` };
        if (options.body && typeof options.body === 'string') {
            headers['Content-Type'] = 'application/json';
        }

        let res = await fetch(url, { ...options, headers });

        if (res.status === 401) {
            const refreshToken = localStorage.getItem('fittrack_refresh');
            if (refreshToken) {
                try {
                    token = await refreshAccessToken(refreshToken);
                    headers.Authorization = `Bearer ${token}`;
                    res = await fetch(url, { ...options, headers });
                } catch {
                    logout();
                    throw new Error('Session expired');
                }
            } else {
                logout();
                throw new Error('Session expired');
            }
        }

        return res;
    }, [refreshAccessToken, logout]);

    return (
        <AuthContext.Provider value={{ user, loading, error, login, register, logout, apiFetch }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
