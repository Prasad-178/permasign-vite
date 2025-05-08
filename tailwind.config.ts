import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html", // If you have an index.html at the root
    "./src/**/*.{js,ts,jsx,tsx,html,css}", // Make sure this covers all files where you use Tailwind classes
                                        // Including .css if you use @apply in files like globals.css
  ],
  theme: {
    extend: {
      // You can extend your theme here
    },
  },
  plugins: [
    // Add any Tailwind plugins here
  ],
} satisfies Config 