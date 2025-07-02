import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
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
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))',
  				'background-start': 'hsl(var(--sidebar-background-start))',
  				'background-end': 'hsl(var(--sidebar-background-end))',
  				'menu-item': {
  					background: 'var(--sidebar-menu-item-background)',
  					'background-hover': 'hsl(var(--sidebar-menu-item-background-hover))',
  					'background-active': 'hsl(var(--sidebar-menu-item-background-active))',
  					color: 'hsl(var(--sidebar-menu-item-color))',
  					'color-hover': 'hsl(var(--sidebar-menu-item-color-hover))',
  					'color-active': 'hsl(var(--sidebar-menu-item-color-active))',
  					border: 'var(--sidebar-menu-item-border)',
  					'border-hover': 'var(--sidebar-menu-item-border-hover)',
  					'border-active': 'var(--sidebar-menu-item-border-active)',
  				},
  				icon: {
  					color: 'hsl(var(--sidebar-icon-color))',
  					'color-hover': 'hsl(var(--sidebar-icon-color-hover))',
  					'color-active': 'hsl(var(--sidebar-icon-color-active))',
  				},
  				'group-label': {
  					color: 'hsl(var(--sidebar-group-label-color))',
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'sidebar': 'var(--sidebar-border-radius)',
  			'sidebar-menu': 'var(--sidebar-menu-item-border-radius)',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		spacing: {
  			'sidebar-padding-x': 'var(--sidebar-padding-x)',
  			'sidebar-padding-y': 'var(--sidebar-padding-y)',
  			'sidebar-margin': 'var(--sidebar-margin)',
  			'sidebar-gap': 'var(--sidebar-gap)',
  		},
  		width: {
  			'sidebar': 'var(--sidebar-width)',
  			'sidebar-collapsed': 'var(--sidebar-width-collapsed)',
  		},
  		height: {
  			'sidebar-icon': 'var(--sidebar-icon-size)',
  		},
  		fontSize: {
  			'sidebar': 'var(--sidebar-font-size)',
  			'sidebar-menu': 'var(--sidebar-menu-item-font-size)',
  			'sidebar-group': 'var(--sidebar-group-label-font-size)',
  		},
  		fontWeight: {
  			'sidebar': 'var(--sidebar-font-weight)',
  			'sidebar-menu': 'var(--sidebar-menu-item-font-weight)',
  			'sidebar-menu-active': 'var(--sidebar-menu-item-font-weight-active)',
  			'sidebar-group': 'var(--sidebar-group-label-font-weight)',
  		},
  		lineHeight: {
  			'sidebar': 'var(--sidebar-line-height)',
  			'sidebar-menu': 'var(--sidebar-menu-item-line-height)',
  		},
  		letterSpacing: {
  			'sidebar': 'var(--sidebar-letter-spacing)',
  			'sidebar-group': 'var(--sidebar-group-label-letter-spacing)',
  		},
  		borderWidth: {
  			'sidebar': 'var(--sidebar-border-width)',
  		},
  		boxShadow: {
  			'sidebar': 'var(--sidebar-shadow)',
  			'sidebar-hover': 'var(--sidebar-shadow-hover)',
  			'sidebar-active': 'var(--sidebar-shadow-active)',
  		},
  		transitionDuration: {
  			'sidebar': 'var(--sidebar-transition-duration)',
  		},
  		transitionTimingFunction: {
  			'sidebar': 'var(--sidebar-transition-timing)',
  		},
  		textTransform: {
  			'sidebar': 'var(--sidebar-text-transform)',
  			'sidebar-group': 'var(--sidebar-group-label-text-transform)',
  		},
  		textDecoration: {
  			'sidebar': 'var(--sidebar-text-decoration)',
  		},
  		fontFamily: {
  			'sidebar': 'var(--sidebar-font-family)',
  		},
  		padding: {
  			'sidebar-x': 'var(--sidebar-padding-x)',
  			'sidebar-y': 'var(--sidebar-padding-y)',
  			'sidebar-menu-x': 'var(--sidebar-menu-item-padding-x)',
  			'sidebar-menu-y': 'var(--sidebar-menu-item-padding-y)',
  			'sidebar-group': 'var(--sidebar-group-label-padding)',
  		},
  		margin: {
  			'sidebar': 'var(--sidebar-margin)',
  			'sidebar-menu': 'var(--sidebar-menu-item-margin)',
  			'sidebar-group': 'var(--sidebar-group-label-margin)',
  		},
  		gap: {
  			'sidebar': 'var(--sidebar-gap)',
  		},
  	}
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
