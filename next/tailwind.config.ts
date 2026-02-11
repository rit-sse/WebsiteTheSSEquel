import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
const defaultTheme = require('tailwindcss/defaultTheme');

const config: Config = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    variants: {
        extend: {
            animation: ['group-hover', 'group-focus'],
        },
    },
    theme: {
        extend: {
            typography: (theme: any) => ({
                DEFAULT: {
                    css: {
                        '--tw-prose-body': 'hsl(var(--foreground))',
                        '--tw-prose-headings': 'hsl(var(--foreground))',
                        '--tw-prose-lead': 'hsl(var(--muted-foreground))',
                        '--tw-prose-links': 'hsl(var(--primary))',
                        '--tw-prose-bold': 'hsl(var(--foreground))',
                        '--tw-prose-counters': 'hsl(var(--muted-foreground))',
                        '--tw-prose-bullets': 'hsl(var(--muted-foreground))',
                        '--tw-prose-hr': 'hsl(var(--border))',
                        '--tw-prose-quotes': 'hsl(var(--foreground))',
                        '--tw-prose-quote-borders': 'hsl(var(--border))',
                        '--tw-prose-captions': 'hsl(var(--muted-foreground))',
                        '--tw-prose-code': 'hsl(var(--foreground))',
                        '--tw-prose-pre-code': 'hsl(var(--foreground))',
                        '--tw-prose-pre-bg': 'hsl(var(--muted))',
                        '--tw-prose-th-borders': 'hsl(var(--border))',
                        '--tw-prose-td-borders': 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                        a: {
                            color: 'hsl(var(--primary))',
                            textDecoration: 'underline',
                            '&:hover': {
                                color: 'hsl(var(--primary) / 0.8)',
                            },
                        },
                        strong: {
                            color: 'hsl(var(--foreground))',
                            fontWeight: '700',
                        },
                        code: {
                            color: 'hsl(var(--foreground))',
                            backgroundColor: 'hsl(var(--muted))',
                            padding: '0.2em 0.4em',
                            borderRadius: '0.25rem',
                            fontWeight: '600',
                        },
                        'code::before': {
                            content: '""',
                        },
                        'code::after': {
                            content: '""',
                        },
                        pre: {
                            backgroundColor: 'hsl(var(--muted))',
                            color: 'hsl(var(--foreground))',
                        },
                        hr: {
                            borderColor: 'hsl(var(--border))',
                        },
                        blockquote: {
                            color: 'hsl(var(--foreground))',
                            borderLeftColor: 'hsl(var(--border))',
                        },
                        h1: {
                            color: 'hsl(var(--foreground))',
                        },
                        h2: {
                            color: 'hsl(var(--foreground))',
                        },
                        h3: {
                            color: 'hsl(var(--foreground))',
                        },
                        h4: {
                            color: 'hsl(var(--foreground))',
                        },
                        'ul > li::marker': {
                            color: 'hsl(var(--muted-foreground))',
                        },
                        'ol > li::marker': {
                            color: 'hsl(var(--muted-foreground))',
                        },
                    },
                },
            }),
            fontFamily: {
                sans: [
                    'var(--font-inter)',
                    ...defaultTheme.fontFamily.sans
                ],
                display: [
                    'var(--font-display)',
                    ...defaultTheme.fontFamily.sans
                ],
                heading: [
                    'var(--font-display)',
                    ...defaultTheme.fontFamily.sans
                ],
            },
            transitionProperty: {
                height: 'height'
            },
            keyframes: {
                wiggle: {
                    '0%': { transform: 'rotate(0deg)' },
                    '25%': { transform: 'rotate(-3deg)' },
                    '75%': { transform: 'rotate(3deg)' },
                    '100%': { transform: 'rotate(0deg)' }
                },
                shake: {
                    '0%': { transform: 'translateX(0)' },
                    '6.5%': { transform: 'translateX(-6px) rotateY(-9deg)' },
                    '18.5%': { transform: 'translateX(5px) rotateY(7deg)' },
                    '31.5%': { transform: 'translateX(-3px) rotateY(-5deg)' },
                    '43.5%': { transform: 'translateX(2px) rotateY(3deg)' },
                    '50%': { transform: 'translateX(0)' }
                },
                heartBeat: {
                    '0%': { transform: 'scale(1)' },
                    '14%': { transform: 'scale(1.2)' },
                    '28%': { transform: 'scale(1)' },
                    '42%': { transform: 'scale(1.2)' },
                    '70%': { transform: 'scale(1)' }
                }
            },
            animation: {
                wiggle: 'wiggle 1s linear infinite',
                shake: 'shake 1s ease-in-out infinite',
                heartBeat: 'heartBeat 1s ease-in-out infinite'
            },
            colors: {
                // Custom colors
                'emerald-750': '#047857',
                'slate-750': '#293548',
                'slate-850': '#172033',
                'slate-1000': '#000004',
                
                // shadcn/ui colors using CSS variables
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                accentScale: {
                    '1': 'hsl(var(--accent-1))',
                    '2': 'hsl(var(--accent-2))',
                    '3': 'hsl(var(--accent-3))',
                    '4': 'hsl(var(--accent-4))',
                    '5': 'hsl(var(--accent-5))',
                    '6': 'hsl(var(--accent-6))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))',
                    '6': 'hsl(var(--chart-6))',
                    '7': 'hsl(var(--chart-7))',
                    '8': 'hsl(var(--chart-8))',
                    '9': 'hsl(var(--chart-9))',
                    '10': 'hsl(var(--chart-10))'
                },
                
                // Semantic colors (replacing DaisyUI)
                info: 'hsl(var(--info))',
                success: 'hsl(var(--success))',
                warning: 'hsl(var(--warning))',
                error: 'hsl(var(--error))',
                
                // Base colors (replacing DaisyUI base-100, base-200, etc.)
                'base-100': 'hsl(var(--background))',
                'base-200': 'hsl(var(--muted))',
                'base-300': 'hsl(var(--accent))',
                'base-content': 'hsl(var(--foreground))',
                
                // Surface/Depth system
                surface: {
                    '0': 'hsl(var(--surface-0))',
                    '1': 'hsl(var(--surface-1))',
                    '2': 'hsl(var(--surface-2))',
                    '3': 'hsl(var(--surface-3))',
                    '4': 'hsl(var(--surface-4))',
                },

                // Dedicated text tiers
                text: {
                    high: 'hsl(var(--text-high))',
                    mid: 'hsl(var(--text-mid))',
                    subtle: 'hsl(var(--text-subtle))',
                },

                on: {
                    overlay: 'hsl(var(--text-on-overlay))',
                },

                // Border/separator tiers
                borderTier: {
                    subtle: 'hsl(var(--border-subtle))',
                    DEFAULT: 'hsl(var(--border-default))',
                    strong: 'hsl(var(--border-strong))',
                },

                // Shared interaction helpers
                interactive: {
                    disabled: 'hsl(var(--interactive-disabled))',
                },
                
                // Dropdown color
                dropdown: 'hsl(var(--dropdown))',
                
                // Neobrutalism colors
                main: {
                    DEFAULT: 'hsl(var(--main))',
                    foreground: 'hsl(var(--main-foreground))',
                },
                'secondary-background': 'hsl(var(--secondary-background))',
                overlay: 'hsl(var(--overlay))',
            },
            boxShadow: {
                'radial-sm': '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                'radial-md': '0 0 10px 2px rgba(0, 0, 0, 0.2)',
                'radial-lg': '0 0 15px 3px rgba(0, 0, 0, 0.2)',
                'radial-xl': '0 0 20px 5px rgba(0, 0, 0, 0.2)',
                'radial-2xl': '0 0 25px 5px rgba(0, 0, 0, 0.2)',
                'radial-3xl': '0 0 30px 5px rgba(0, 0, 0, 0.2)',
                'shadow': 'var(--shadow)',
                'card': 'var(--card-shadow)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
                base: 'var(--radius-base)',
            },
            boxShadowColor: {
                shadow: 'var(--shadow)',
            },
            translate: {
                boxShadowX: 'var(--box-shadow-x)',
                boxShadowY: 'var(--box-shadow-y)',
                reverseBoxShadowX: 'var(--reverse-box-shadow-x)',
                reverseBoxShadowY: 'var(--reverse-box-shadow-y)',
            },
            borderWidth: {
                'style': 'var(--border-width)',
            },
        }
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
        require('@tailwindcss/aspect-ratio'),
        require("tailwindcss-animate"),
        // Custom style mode variants for neo/clean toggle
        plugin(function({ addVariant }) {
            addVariant('neo', '[data-style="neo"] &')
            addVariant('clean', '[data-style="clean"] &')
        }),
    ],
}
export default config
