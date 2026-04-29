/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores institucionales según el Manual de Identidad
        petroleo: '#1A3D3D',
        esmeralda: '#2D6A6A',
        tealClaro: '#4DB6AC',
        ceniza: '#F4F7F7',
        antracita: '#333333',
      },
      borderRadius: {
        // Redondeos estilo "Burbuja Premium"
        'burbuja': '32px',
        'burbuja-lg': '40px',
      }
    },
  },
  plugins: [],
}