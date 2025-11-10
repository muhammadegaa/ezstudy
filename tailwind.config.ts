import type { Config } from 'tailwindcss'
import { tokens } from './design-system/tokens'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './design-system/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        secondary: tokens.colors.secondary,
        success: tokens.colors.success,
        error: tokens.colors.error,
        warning: tokens.colors.warning,
        info: tokens.colors.info,
        gray: tokens.colors.gray,
      },
      spacing: tokens.spacing,
      fontFamily: {
        sans: [...tokens.typography.fontFamily.sans],
        mono: [...tokens.typography.fontFamily.mono],
      },
      fontSize: Object.fromEntries(
        Object.entries(tokens.typography.fontSize).map(([key, value]) => [
          key,
          Array.isArray(value)
            ? [value[0], { ...(value[1] as object) }]
            : value,
        ])
      ) as any, // Type assertion needed due to readonly array incompatibility
      fontWeight: { ...tokens.typography.fontWeight } as any,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadow,
      transitionDuration: tokens.transition.duration,
      transitionTimingFunction: tokens.transition.easing,
      zIndex: Object.fromEntries(
        Object.entries(tokens.zIndex).map(([key, value]) => [key, String(value)])
      ) as any,
      screens: tokens.breakpoints,
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
