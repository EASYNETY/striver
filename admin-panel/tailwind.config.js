/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                striver: {
                    green: "#8FFBB9",
                    dark: "#050811",
                    light: "#0a1128",
                    glass: "rgba(255, 255, 255, 0.03)",
                }
            },
            fontFamily: {
                outfit: ['Outfit', 'sans-serif'],
            },
            boxShadow: {
                'striver-glow': '0 0 20px rgba(143, 251, 185, 0.2)',
                'striver-glow-lg': '0 0 40px rgba(143, 251, 185, 0.3)',
            }
        },
    },
    plugins: [],
}
