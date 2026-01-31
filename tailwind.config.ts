import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Direction C: Playful Creator palette
        cream: "#FFFBF7",
        surface: "#FFFFFF",
        'surface-alt': "#FFF0EB",
        'text-primary': "#3D3125",
        'text-secondary': "#7D705E",
        'text-muted': "#9C8E7D",
        coral: "#FF6B5B",
        'coral-dark': "#E85A4A",
        lavender: "#B794F4",
        sunny: "#FBBF24",
        peach: "#FFF0EB",
        // Legacy aliases
        mocha: "#A47864",
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 1.5s ease-in-out infinite',
        'progress-indeterminate': 'progressIndeterminate 1.5s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'chip-pop': 'chipPop 0.2s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(100vh) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.2' },
          '90%': { opacity: '0.2' },
          '100%': { transform: 'translateY(-20px) rotate(360deg)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        progressIndeterminate: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        bounceSubtle: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        chipPop: {
          '0%': { transform: 'scale(0.9)', opacity: '0.5' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
