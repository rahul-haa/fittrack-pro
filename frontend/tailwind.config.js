/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                navy: '#0A0E1A',
                dpurple: '#1A0A2E',
                charcoal: '#0D1117',
                neon: '#00FF88',
                electric: '#00C8FF',
                'neon-dim': '#00cc6e',
                'electric-dim': '#00a0cc',
                glass: {
                    100: 'rgba(255, 255, 255, 0.05)',
                    200: 'rgba(255, 255, 255, 0.08)',
                    300: 'rgba(255, 255, 255, 0.12)',
                    400: 'rgba(255, 255, 255, 0.18)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-main': 'linear-gradient(135deg, #0A0E1A 0%, #1A0A2E 50%, #0D1117 100%)',
                'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                'gradient-neon': 'linear-gradient(135deg, #00FF88 0%, #00C8FF 100%)',
            },
            boxShadow: {
                'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
                'neon': '0 0 20px rgba(0, 255, 136, 0.3)',
                'electric': '0 0 20px rgba(0, 200, 255, 0.3)',
                'neon-lg': '0 0 40px rgba(0, 255, 136, 0.4)',
            },
            animation: {
                'wave': 'wave 2.5s ease-in-out infinite',
                'wave-slow': 'wave 3.5s ease-in-out infinite',
                'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                wave: {
                    '0%, 100%': { transform: 'translateX(0) translateY(0)' },
                    '50%': { transform: 'translateX(-25%) translateY(-5px)' },
                },
                pulseNeon: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(0, 255, 136, 0.6)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
        },
    },
    plugins: [],
}
